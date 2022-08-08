<?php

/**
 * @file
 * Enables modules and site configuration for a drustack site installation.
 */

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\features\ConfigurationItem;
use Drupal\features\FeaturesManagerInterface;
use Drupal\user\Entity\Role;
use Drupal\user\Entity\User;
use Drupal\user\UserInterface;

/**
 * Implements hook_install_tasks().
 */
function drustack_install_tasks($install_state) {
  $modules = [
    'drustack_core',
    'drustack_devel',
    'drustack_seo',
    'drustack_performance',
    'drustack_wysiwyg',
    'drustack_paragraphs',
    'drustack_layout',
    'drustack_page',
    'drustack_article',
    'drustack_blog',
    'drustack_webform',
  ];
  \Drupal::state()->set('drustack_features_exports', $modules);

  return [
    '_drustack_features_install' => [
      'display_name' => t('Install features'),
      'type' => 'batch',
    ],
    '_drustack_features_import_all' => [
      'display_name' => t('Import features'),
      'type' => 'batch',
    ],
    '_drustack_configure_cleanup' => [],
  ];
}

/**
 * Implements hook_form_FORM_ID_alter() for install_configure_form().
 *
 * Allows the profile to alter the site configuration form.
 */
function drustack_form_install_configure_form_alter(&$form, FormStateInterface $form_state) {
  // Clear drupal message queue for non-errors.
  \Drupal::service('messenger')->deleteByType(MessengerInterface::TYPE_STATUS);
  \Drupal::service('messenger')->deleteByType(MessengerInterface::TYPE_WARNING);

  // Site information form.
  $form['site_information']['#weight'] = -20;
  $form['site_information']['site_name']['#default_value'] = \Drupal::request()->server->get('SERVER_NAME');
  $form['site_information']['site_mail']['#default_value'] = 'admin@example.com';

  // Administrator account form.
  $form['admin_account']['#weight'] = -19;
  $form['admin_account']['account']['name']['#default_value'] = 'admin';
  $form['admin_account']['account']['mail']['#default_value'] = 'admin@example.com';

  // Power user account form.
  $form['webmaster_account'] = [
    '#type' => 'fieldgroup',
    '#title' => t('Site power user account'),
    '#collapsible' => FALSE,
  ];

  $form['webmaster_account']['#weight'] = -18;
  $form['webmaster_account']['webmaster_account']['#tree'] = TRUE;
  $form['webmaster_account']['webmaster_account']['name'] = [
    '#type' => 'textfield',
    '#title' => t('Username'),
    '#default_value' => 'webmaster',
    '#maxlength' => UserInterface::USERNAME_MAX_LENGTH,
    '#description' => t("Several special characters are allowed, including space, period (.), hyphen (-), apostrophe ('), underscore (_), and the @ sign."),
    '#required' => TRUE,
    '#attributes' => ['class' => ['username']],
  ];

  $form['webmaster_account']['webmaster_account']['mail'] = [
    '#type' => 'email',
    '#title' => t('Email address'),
    '#default_value' => 'webmaster@example.com',
    '#required' => TRUE,
  ];

  // Just alter the weight.
  $form['regional_settings']['#weight'] = -17;
  $form['update_notifications']['#weight'] = -16;
  $form['actions']['#weight'] = -15;

  // Add our own validation.
  $form['#validate'][] = '_drustack_form_install_configure_form_validate';

  // Add our own submit handler.
  $form['#submit'][] = '_drustack_form_install_configure_form_submit';
}

/**
 * Validate Power user account.
 */
function _drustack_form_install_configure_form_validate($form, FormStateInterface $form_state) {
  // Check admin account.
  if ($error = user_validate_name($form_state->getValue(['webmaster_account', 'name']))) {
    $form_state->setErrorByName('webmaster_account][name', $error);
  }
  if ($form_state->getValue(['webmaster_account', 'name']) == $form_state->getValue(['account', 'name'])) {
    $form_state->setErrorByName('webmaster_account][name', t('The admin name is not valid.'));
  }
  if ($form_state->getValue(['webmaster_account', 'mail']) == $form_state->getValue(['account', 'mail'])) {
    $form_state->setErrorByName('webmaster_account][mail', t('The admin email address is not valid.'));
  }
}

/**
 * Create Power user account and change root password.
 */
function _drustack_form_install_configure_form_submit($form, FormStateInterface $form_state) {
  // Add the user and associate role here.
  $role = Role::load('power');
  if (!$role) {
    $role = Role::create([
      'id' => 'power',
      'label' => 'Power user',
    ]);
    $role->save();
  }

  // We keep power user and administrator account password in sync by default.
  $account = User::create([
    'mail' => $form_state->getValue(['webmaster_account', 'mail']),
    'name' => $form_state->getValue(['webmaster_account', 'name']),
    'pass' => $form_state->getValue(['account', 'pass']),
    'init' => $form_state->getValue(['webmaster_account', 'mail']),
    'status' => 1,
    'roles' => [$role],
  ]);
  $account->save();
}

/**
 * Install features exports.
 *
 * @return
 *   The batch definition.
 *
 * @see install_profile_modules()
 */
function _drustack_features_install(&$install_state) {
  $features = \Drupal::state()->get('drustack_features_exports') ?: [];
  $files =  \Drupal::service('extension.list.module')->getList();

  // Always install required modules first. Respect the dependencies between
  // the modules.
  $required = [];
  $non_required = [];

  // Add modules that other modules depend on.
  $modules = [];
  foreach ($features as $module) {
    if ($files[$module]->requires) {
      $modules = array_merge($modules, array_keys($files[$module]->requires));
    }
  }
  $modules = array_unique($modules);
  foreach ($modules as $module) {
    if (!empty($files[$module]->info['required'])) {
      $required[$module] = $files[$module]->sort;
    }
    else {
      $non_required[$module] = $files[$module]->sort;
    }
  }

  arsort($required);
  arsort($non_required);
  $features = array_flip($features);

  $operations = [];
  foreach ($required + $non_required + $features as $module => $weight) {
    $operations[] = ['_install_module_batch', [$module, $files[$module]->info['name']]];
  }

  $batch = [
    'operations' => $operations,
    'title' => t('Installing @drupal', ['@drupal' => drupal_install_profile_distribution_name()]),
    'error_message' => t('The installation has encountered an error.'),
  ];

  return $batch;
}

/**
 * Import all features exports.
 *
 * @return
 *   The batch definition.
 *
 * @see drush_features_import_all()
 */
function _drustack_features_import_all(&$install_state) {
  $manager = \Drupal::service('features.manager');
  $packages = $manager->getPackages();
  $packages = $manager->filterPackages($packages);

  $operations = [];
  foreach ($packages as $package) {
    $overrides = $manager->detectOverrides($package);
    if ($package->getStatus() == FeaturesManagerInterface::STATUS_INSTALLED) {
      $operations[] = ['_drustack_features_import', [$package->getMachineName(), $package->getName()]];
    }
  }

  $batch = [
    'operations' => $operations,
    'title' => t('Importing @drupal', ['@drupal' => drupal_install_profile_distribution_name()]),
    'error_message' => t('The installation has encountered an error.'),
  ];

  return $batch;
}

/**
 * Revert features exports.
 *
 * @see drush_features_export()
 */
function _drustack_features_import($module, $module_name, &$context) {
  $context['results'][] = $module;

  $manager = \Drupal::service('features.manager');
  $config_revert = \Drupal::service('features.config_update');

  $module_handler = \Drupal::moduleHandler();
  $modules = $module_handler->getModuleList();

  if (!empty($modules[$module])) {
    $extension = $modules[$module];
    $feature = $manager->initPackageFromExtension($extension);
    $feature->setConfig($manager->listExtensionConfig($extension));
    $feature->setStatus(FeaturesManagerInterface::STATUS_INSTALLED);

    $components = $feature->getConfigOrig();
    foreach ($components as $component) {
      if (!isset($config[$component])) {
        $item = $manager->getConfigType($component);
        $type = ConfigurationItem::fromConfigStringToConfigType($item['type']);
        $config_revert->import($type, $item['name_short']);
        $context['message'] = t('Import %module : %component.', ['%module' => $module_name, '%component' => $component]);
      }
      else {
        $item = $config[$component];
        $type = ConfigurationItem::fromConfigStringToConfigType($item->getType());
        $config_revert->revert($type, $item->getShortName());
        $context['message'] = t('Revert %module : %component.', ['%module' => $module_name, '%component' => $component]);
      }
    }
  }
}

/**
 * Various actions needed to clean up after the installation.
 */
function _drustack_configure_cleanup() {
  // Clear the APC cache to ensure APC class loader is reset.
  if (function_exists('apc_fetch')) {
    apc_clear_cache('user');
  }

  // Flush all existing path aliases.
  \Drupal::service('database')->delete('url_alias');

  // Rebuild node access database.
  node_access_rebuild();

  // Rebuild the menu.
  \Drupal::service('router.builder')->rebuild();

  // Clear out caches.
  drupal_flush_all_caches();

  // Clear out JS and CSS caches.
  \Drupal::service('asset.css.collection_optimizer')->deleteAll();
  \Drupal::service('asset.js.collection_optimizer')->deleteAll();

  // Clear drupal message queue for non-errors.
  \Drupal::service('messenger')->deleteByType(MessengerInterface::TYPE_STATUS);
  \Drupal::service('messenger')->deleteByType(MessengerInterface::TYPE_WARNING);
}
