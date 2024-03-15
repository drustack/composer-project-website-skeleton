/**
 * @file
 * Global utilities.
 *
 */
 (function ($, Drupal) {

  'use strict';

  const XL = 1200;
  const toolbar = document.querySelector("#toolbar-bar");
  const toolbarManage = document.querySelector("#toolbar-bar .toolbar-tab:nth-of-type(3)");
  const toolbarTray = document.querySelector("#toolbar-item-administration-tray");

  const header = document.querySelector("#header");
  const drawer = document.querySelector("#start_menu_block");
  const drawerBtn = document.querySelector(".drawer_btn_wrapper .drawer_btn");
  const navbarMenu = document.querySelector("#header .navbar-toggler");
  const navMain = document.querySelector("#header #navbar-main");
  const mainNav = document.querySelector("#header .block-menu");
  const menuList = document.querySelector("#header .navbar-nav");
  const menuBottom = document.querySelector("#header .menu_bottom");
  const expandableItems = document.querySelectorAll("#header li.menu-item--expanded");
  const expandableItemsLevel1 = document.querySelectorAll("#header .nav-item.menu-item--expanded");
  const expandableItemsLevel2 = document.querySelectorAll("#header .nav-item.menu-item--expanded > ul > li.menu-item--expanded");
  const expandableItemsLevel3 = document.querySelectorAll("#header .nav-item.menu-item--expanded > ul > li.menu-item--expanded > ul > li.menu-item--expanded");
  const paddingLeft = 20;

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
    if(toolbarTray.classList.contains("toolbar-tray-vertical")) {
      height = toolbar.getBoundingClientRect().height;
    } else {
      height = toolbar.getBoundingClientRect().height + toolbarTray.getBoundingClientRect().height;
    }
    return height;
  }

  const isDescendant = (parent, child) => {
    let node = child.parentNode;
    while (node) {
      if (node === parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const isExpanded = (el) => {
    return el.getAttribute("aria-expanded") === "true";
  }

  const calMenuWidth = (level, padding_left, menu_list_width, dropdown_button_width) => {
    for (let i = 0; i < level.length; i++) {
      let linkTag = level[i].querySelector(":scope > a:first-child");
      let spanTag = level[i].querySelector(":scope > span:first-child");
      if (linkTag) {
        linkTag.style.maxWidth = `${menu_list_width - padding_left - dropdown_button_width}px`;
      } else if (spanTag) {
        spanTag.classList.add("hide");
      }
    }
  }

  const handleOneLevel = (items) => {
    for (let i = 0; i < items.length; i++) {
      items[i].querySelector(".dropdown-toggle").addEventListener("click", (el) => {
        if (window.innerWidth < XL) {
          items[i].querySelector(".dropdown-menu").removeAttribute("style");
          for (let j = 0; j < items.length; j++) {
            let dropdownBtn =  items[j].querySelector(".dropdown-toggle");
            let list = items[j].querySelector(".dropdown-menu");
            if (i != j) {
              dropdownBtn.classList.remove("show");
              dropdownBtn.setAttribute("aria-expanded", "false");
              list.classList.remove("show");
              list.removeAttribute("data-bs-popper");
              dropdownBtn.classList.remove("show_nolink");
              list.classList.remove("show_nolink");
            } else {
              let spanTag = items[i].querySelector("span");
              let itemParent =  items[i].parentNode;
              let itemGrandparent = itemParent.parentNode;
              if (spanTag) {
                itemParent.classList.add("show_nolink");
                itemGrandparent.querySelector(".dropdown-toggle").classList.add("show_nolink");
                setTimeout(function () {
                  itemParent.classList.add("show");
                  itemGrandparent.querySelector(".dropdown-toggle").classList.add("show");
                  itemGrandparent.querySelector(".dropdown-toggle").setAttribute("aria-expanded", true);
                }, 50);
              }
            }
          }
        }
        let menuListWidth = menuList.getBoundingClientRect().width;
        let dropdownBtnWidth = el.target.getBoundingClientRect().width;
        let menuItem = items[i].querySelector(":scope > a:first-child");
        if (menuItem) {
          menuItem.style.maxWidth = `${menuListWidth - paddingLeft - dropdownBtnWidth}px`;
        }
      });
    }
  }

  const handleMobileMenu = () => {
    if(navbarMenu) {
      navbarMenu.addEventListener("click", () => {
        if (isExpanded(navbarMenu)) {
          if(menuBottom) {
            mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top - menuBottom.getBoundingClientRect().height}px`;
          } else {
            mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top}px`;
          }
          setTimeout(function () {
            let menuListWidth = menuList.getBoundingClientRect().width;
            let dropdownBtn = menuList.querySelector(".dropdown-toggle");
            if(dropdownBtn) {
              let dropdownBtnWidth = dropdownBtn.getBoundingClientRect().width;
              calMenuWidth(expandableItemsLevel1, 0, menuListWidth, dropdownBtnWidth);
              calMenuWidth(expandableItemsLevel2, paddingLeft, menuListWidth, dropdownBtnWidth);
              calMenuWidth(expandableItemsLevel3, paddingLeft * 2, menuListWidth, dropdownBtnWidth);
            }
          }, 100);
        } 
      });
    }

    if(navMain) {
      navMain.addEventListener("click", (el) => {
        if (window.innerWidth < XL) {
          let items = menuList.querySelectorAll(":scope > li");
          let isWithinMenu = false;
          for (let item of items) {
            isWithinMenu = isWithinMenu || item.contains(el.target);
          }
          if (!isWithinMenu) {
            for (let j = 0; j < expandableItemsLevel1.length; j++) {
              expandableItemsLevel1[j].querySelector(".dropdown-toggle").classList.remove("show_nolink");
              expandableItemsLevel1[j].querySelector(".dropdown-menu").classList.remove("show_nolink");
            }
          }
        }
      });
    }

    for (let i = 0; i < expandableItems.length; i++) {
      if (window.innerWidth < XL) {
        let dropdownBtn = expandableItems[i].querySelector("a.dropdown-toggle");
        if (dropdownBtn) {
          dropdownBtn.innerHTML = "";
        }
      }
      let dropdownBtn = expandableItems[i].querySelector(".dropdown-toggle");
      let menuList = expandableItems[i].querySelector(".dropdown-menu");
      if(dropdownBtn) {
        dropdownBtn.addEventListener("click", function () {
          if (window.innerWidth >= XL) {
            location.href = this.href;
          }
        });
      }

      expandableItems[i].addEventListener("mouseenter", () => {
        if (window.innerWidth >= XL) {
          menuList.classList.add("show");
          dropdownBtn.setAttribute("aria-expanded", "true");
          setTimeout(function () {
            menuList.classList.add("start");
          }, 50);
        }
      });

      expandableItems[i].addEventListener("mouseleave", () => {
        if (window.innerWidth >= XL) {
          menuList.classList.remove("show");
          dropdownBtn.setAttribute("aria-expanded", "false");
          for (let j = 0; j < expandableItems.length; j++) {
            if (i != j) {
              if (isDescendant(expandableItems[i], expandableItems[j])) {
                expandableItems[j].querySelector(".dropdown-menu").classList.remove("show");
                expandableItems[j].querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
              }
            }
          }
          setTimeout(function () {
            menuList.classList.remove("start");
          }, 50);
        }
      });
    }

    for (let i = 0; i < expandableItemsLevel1.length; i++) {
      expandableItemsLevel1[i].addEventListener("mouseenter", () => {
        if (window.innerWidth >= XL) {
          let list = expandableItemsLevel1[i].querySelector(".dropdown-menu");
          let shift = (list.getBoundingClientRect().width - expandableItemsLevel1[i].getBoundingClientRect().width) / 2;
          if (shift > 0) {
            list.setAttribute("style", `left: ${-1 * shift}px`);
          }
        }
      });
      expandableItemsLevel1[i].querySelector(".dropdown-toggle").addEventListener("click", (el) => {
        if (window.innerWidth < XL) {
          for (let j = 0; j < expandableItemsLevel1.length; j++) {
            expandableItemsLevel1[j].querySelector(".dropdown-toggle").classList.remove("show_nolink");
            expandableItemsLevel1[j].querySelector(".dropdown-menu").classList.remove("show_nolink");
          }
        }
      });
    }

    handleOneLevel(expandableItemsLevel2);
    handleOneLevel(expandableItemsLevel3);
  }

  window.addEventListener("resize", () => {
    if (toolbar) {
      header.style.top = `${getToolbarHeight()}px`;
    }
    if (window.innerWidth >= XL) {
      for (let i = 0; i < expandableItems.length; i++) {
        let dropdownBtn = expandableItems[i].querySelector(".dropdown-toggle");
        let dropdownMenu = expandableItems[i].querySelector(".dropdown-menu");
        if(dropdownBtn) {
          if (dropdownBtn.innerHTML == "") {
            let menuTitle = expandableItems[i].querySelector(":scope > a:first-child") || expandableItems[i].querySelector(":scope > span:first-child");
            if(menuTitle) {
              dropdownBtn.innerHTML = menuTitle.innerHTML;
            }
          }
          if (dropdownBtn.classList.contains("show")) {
            dropdownBtn.classList.remove("show");
            dropdownBtn.setAttribute("aria-expanded", "false");
          }
          if (dropdownBtn.classList.contains("show_nolink")) {
            dropdownBtn.classList.remove("show_nolink");
          }
        }

        if(dropdownMenu) {
          if (dropdownMenu.classList.contains("show")) {
            dropdownMenu.classList.remove("show");
            dropdownMenu.removeAttribute("data-bs-popper");
          }

          if (dropdownMenu.classList.contains("show_nolink")) {
            dropdownMenu.classList.remove("show_nolink");
          }
        }
        let item = expandableItems[i].querySelector(":scope > a:first-child");
        if (item) {
          item.removeAttribute("style");
        }
      }
      if(mainNav) {
        mainNav.removeAttribute("style");
      }
    } else {
      for (let i = 0; i < expandableItems.length; i++) {
        let dropdownBtn = expandableItems[i].querySelector("a.dropdown-toggle");
        if (dropdownBtn) {
          dropdownBtn.innerHTML = "";
        }
      }

      if (isExpanded(navbarMenu)) {
        let menuListWidth = menuList.getBoundingClientRect().width;
        let dropdownBtn = menuList.querySelector(".dropdown-toggle");
        if(dropdownBtn) {
          let dropdownBtnWidth = dropdownBtn.getBoundingClientRect().width;
          calMenuWidth(expandableItemsLevel1, 0, menuListWidth, dropdownBtnWidth);
          calMenuWidth(expandableItemsLevel2, paddingLeft, menuListWidth, dropdownBtnWidth);
          calMenuWidth(expandableItemsLevel3, paddingLeft * 2, menuListWidth, dropdownBtnWidth);
        }
        if(menuBottom) {
          mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top - menuBottom.getBoundingClientRect().height}px`;
        } else {
          mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top}px`;
        }
      }
    }
  });

  window.addEventListener("focusin", (el) => {
    if (window.innerWidth >= XL) {
      for (let i = 0; i < expandableItems.length; i++) {
        let dropdownBtn = expandableItems[i].querySelector(".dropdown-toggle");
        let dropdownMenu = expandableItems[i].querySelector(".dropdown-menu");
        if (isDescendant(expandableItems[i], el.target)) {
          dropdownBtn.setAttribute("aria-expanded", "true");
          dropdownMenu.classList.add("show");
        } else {
          dropdownBtn.setAttribute("aria-expanded", "false");
          dropdownMenu.classList.remove("show");
        }
      }
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (toolbar) {
      header.style.top = `${getToolbarHeight()}px`;
      toolbarManage.addEventListener("click", () => {
        setTimeout(() => {
          header.style.top = `${getToolbarHeight()}px`;
        }, 100);
      });
    }

    if (drawer && drawerBtn) {
      drawerBtn.addEventListener("click", () => {
        if (drawerBtn.classList.contains("clicked")) {
          drawer.classList.remove("show");
          drawerBtn.classList.remove("clicked");
          header.classList.remove("setHeightWhenDrawerOpen");
        } else {
          drawer.classList.add("show");
          drawerBtn.classList.add("clicked");
          header.classList.add("setHeightWhenDrawerOpen");
        }
        if (isExpanded(navbarMenu)) {
          if(menuBottom) {
            mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top - menuBottom.getBoundingClientRect().height}px`;
          } else {
            mainNav.style.height = `${window.innerHeight - mainNav.getBoundingClientRect().top}px`;
          }
        }
      })
    }

    handleMobileMenu();
  });

})(jQuery, Drupal);