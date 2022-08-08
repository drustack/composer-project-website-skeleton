<?php

namespace Drupal\drustack_layout\Plugin\Layout;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Layout\LayoutDefault;
use Drupal\Core\Plugin\PluginFormInterface;

/**
 * Layouts with configurable wrapper class.
 *
 * @internal
 *   Plugin classes are internal.
 */
class LayoutClasses extends LayoutDefault implements PluginFormInterface {

    /**
     * {@inheritdoc}
     */
    public function defaultConfiguration() {
        return parent::defaultConfiguration() + [
            'layout_classes' => '',
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
        $form['layout_classes'] = [
            '#type' => 'textfield',
            '#title' => t('CSS class(es)'),
            '#description' => t('Customize the styling of this layout by adding CSS classes. Separate multiple classes by spaces.'),
            '#default_value' => $this->configuration['layout_classes'],
        ];

        return $form;
    }

    /**
     * {@inheritdoc}
     */
    public function validateConfigurationForm(array &$form, FormStateInterface $form_state) {
        // noops.
    }

    /**
     * {@inheritdoc}
     */
    public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
        $this->configuration['layout_classes'] = $form_state->getValue('layout_classes');
    }

    /**
     * {@inheritdoc}
     */
    public function build(array $regions) {
        $build = parent::build($regions);
        $build['#attributes']['class'] = [
            'layout',
            $this->getPluginDefinition()->getTemplate(),
            $this->configuration['layout_classes'],
        ];

        return $build;
    }
}
