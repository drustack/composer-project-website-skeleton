/**
 * @file
 * Global utilities.
 *
 */
(function ($, Drupal) {

  'use strict';

  const XL = 1200;
  const toolbar = document.querySelector("#toolbar-bar");
  const header = document.querySelector("#header");
  const drawer = document.querySelector("#start_menu_block");
  const drawerBtn = document.querySelector(".drawer-btn .btn");
  const navbarMenu = document.querySelector("#header .navbar-toggler");
  const mainNav = document.querySelector("#header .menu--header");
  const menuList = document.querySelector("#header .navbar-nav");
  const menuBottom = document.querySelector("#header .menu_bottom");
  const expandableItems = document.querySelectorAll("#header li.menu-item--expanded");
  const expandableNavItems = document.querySelectorAll("#header .nav-item.menu-item--expanded");

  const waitForElm = (selector) => {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  const getToolbarHeight = () => {
    let height = 0;
    const toolbarTray = toolbar.querySelector("#toolbar-item-administration-tray");
    if (toolbarTray) {
      if (toolbarTray.classList.contains("toolbar-tray-vertical")) {
        height = `${toolbar.getBoundingClientRect().height}px`;
      } else {
        height = `${toolbar.getBoundingClientRect().height + toolbarTray.getBoundingClientRect().height}px`;
      }
    }
    return height;
  }

  const isExpanded = (el) => {
    return el.getAttribute("aria-expanded") === "true";
  }

  const setHeight = () => {
    if (menuBottom) {
      mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top - menuBottom.getBoundingClientRect().height}px`;
    } else {
      mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top}px`;
    }
  }

  const setMaxWidth = (item, menu_dropdownMenu_width, dropdown_button_width) => {
    for (let i = 0; i < item.length; i++) {
      let firstChild = item[i].querySelector(":scope > a:first-child") || item[i].querySelector(":scope > span:first-child");
      if (firstChild) {
        firstChild.style.maxWidth = `${menu_dropdownMenu_width - dropdown_button_width}px`;
      }
    }
  }

  window.addEventListener("resize", () => {
    if (toolbar && header) {
      header.style.top = getToolbarHeight();
    }

    if (expandableItems.length > 0 && window.innerWidth >= XL) {
      for (let i = 0; i < expandableItems.length; i++) {
        let dropdownBtn = expandableItems[i].querySelector(".dropdown-toggle");
        let dropdownMenu = expandableItems[i].querySelector(".dropdown-menu");
        let firstChild = expandableItems[i].querySelector(":scope > a:first-child") || expandableItems[i].querySelector(":scope > span:first-child");
        if (dropdownBtn && dropdownBtn.classList.contains("show")) {
          dropdownBtn.classList.remove("show");
          dropdownBtn.setAttribute("aria-expanded", "false");
        }

        if (dropdownMenu && dropdownMenu.classList.contains("show")) {
          dropdownMenu.classList.remove("show");
        }

        if (firstChild && firstChild.hasAttribute("style")) {
          firstChild.removeAttribute("style");
        }
      }
    }

    if (mainNav && mainNav.hasAttribute("style") && window.innerWidth >= XL) {
      mainNav.removeAttribute("style");
    }

    if(document.body.classList.contains("overflow-y") && window.innerWidth >= XL) {
      document.body.classList.remove("overflow-y");
    }

    if(navbarMenu && window.innerWidth < XL) {
      if (isExpanded(navbarMenu)) {
        if(!document.body.classList.contains("overflow-y")) {
          document.body.classList.add("overflow-y");
        }
        if (menuList) {
          let menuListWidth = menuList.getBoundingClientRect().width;
          let dropdownBtn = menuList.querySelector(".nav-item >.dropdown-toggle");
          if (dropdownBtn) {
            let dropdownBtnWidth = dropdownBtn.getBoundingClientRect().width;
            if (expandableItems.length > 0) {
              setMaxWidth(expandableItems, menuListWidth, dropdownBtnWidth);
            }
          }
        }

        if (mainNav) {
          setHeight();
        }
      } else {
        if(document.body.classList.contains("overflow-y")) {
          document.body.classList.remove("overflow-y");
        }
      }
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (toolbar && header) {
      const toolbarManage = toolbar.querySelector(".toolbar-tab:nth-of-type(3)");
      header.style.top = getToolbarHeight();
      if (toolbarManage) {
        toolbarManage.addEventListener("click", () => {
          setTimeout(() => {
            header.style.top = getToolbarHeight();
          }, 100);
        });
      }
    }

    if (drawer && drawerBtn) {
      drawerBtn.addEventListener("click", () => {
        if (drawerBtn.classList.contains("clicked")) {
          drawer.classList.remove("show");
          drawerBtn.classList.remove("clicked");
        } else {
          drawer.classList.add("show");
          drawerBtn.classList.add("clicked");
        }

        if (navbarMenu && window.innerWidth < XL && isExpanded(navbarMenu) && mainNav) {
          setHeight();
        }
      })
    }

    if (navbarMenu) {
      navbarMenu.addEventListener("click", () => {
        if (window.innerWidth < XL) {
          if (isExpanded(navbarMenu)) {
            document.body.classList.add("overflow-y");
            if (mainNav) {
              setHeight();
            }

            if (menuList) {
              let menuListWidth = menuList.getBoundingClientRect().width;
              let dropdownBtn = menuList.querySelector(".nav-item >.dropdown-toggle");
              if (dropdownBtn) {
                let dropdownBtnWidth = dropdownBtn.getBoundingClientRect().width;
                if (expandableItems.length > 0) {
                  setMaxWidth(expandableItems, menuListWidth, dropdownBtnWidth);
                }
              }
            }
          } else {
            document.body.classList.remove("overflow-y");
          }
        }
      });
    }

    if (expandableItems.length > 0) {
      for (let i = 0; i < expandableItems.length; i++) {
        let dropdownBtn = expandableItems[i].querySelector(".dropdown-toggle");
        let dropdownMenu = expandableItems[i].querySelector(".dropdown-menu");
        expandableItems[i].addEventListener("mouseenter", () => {
          if (window.innerWidth >= XL) {
            dropdownMenu.classList.add("show");
            dropdownBtn.setAttribute("aria-expanded", "true");
            setTimeout(function () {
              dropdownMenu.classList.add("start");
            }, 50);
          }
        });

        expandableItems[i].addEventListener("mouseleave", () => {
          if (window.innerWidth >= XL) {
            dropdownMenu.classList.remove("show");
            dropdownBtn.setAttribute("aria-expanded", "false");
            setTimeout(function () {
              dropdownMenu.classList.remove("start");
            }, 50);
          }
        });
      }
    }

    if (expandableNavItems.length > 0) {
      for (let i = 0; i < expandableNavItems.length; i++) {
        expandableNavItems[i].addEventListener("mouseenter", () => {
          if (window.innerWidth >= XL) {
            let dropdownMenu = expandableNavItems[i].querySelector(".dropdown-menu");
            if (dropdownMenu) {
              let shift = (dropdownMenu.getBoundingClientRect().width - expandableNavItems[i].getBoundingClientRect().width) * 0.5;
              if (shift > 0) {
                dropdownMenu.style.left = `${-1 * shift}px`;
              }
            }
          }
        });
      }
    }
  });

})(jQuery, Drupal);