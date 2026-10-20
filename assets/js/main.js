/**
 * 广东紫翔科技有限公司 · 官网首版脚本
 * 职责（架构文档 §4.3）：导航滚动态、移动端抽屉、平滑锚点、轻量入场动画、
 * 表单本地校验与占位提交反馈、prefers-reduced-motion 降级。
 * 禁止：自动轮播、复杂动画库、任何网络请求。
 */
(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------
   * 1. 导航滚动态：滚动超过 40px 时切换为白底态
   * ---------------------------------------------------------- */
  var header = doc.getElementById("site-header");
  if (header) {
    var syncHeader = function () {
      header.classList.toggle("nav--scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", syncHeader, { passive: true });
    syncHeader();
  }

  /* ------------------------------------------------------------
   * 2. 移动端抽屉菜单：aria 同步、body 锁滚动、Esc 关闭
   * ---------------------------------------------------------- */
  var drawer = doc.getElementById("mobile-drawer");
  var toggles = doc.querySelectorAll("[data-drawer-toggle]");

  var setDrawer = function (open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    doc.body.classList.toggle("is-locked", open);
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (open) {
      var closeBtn = drawer.querySelector(".drawer__close");
      if (closeBtn) {
        // 抽屉由 visibility:hidden 过渡打开：点击当帧计算样式仍为 hidden，
        // 同步 focus() 会落在不可见元素上而失败。延迟两帧待样式生效后再移动焦点。
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            closeBtn.focus();
          });
        });
      }
    }
  };

  var isDrawerOpen = function () {
    return drawer && drawer.classList.contains("is-open");
  };

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setDrawer(!isDrawerOpen());
    });
  });

  // 点击抽屉内链接后自动收起
  if (drawer) {
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setDrawer(false);
      });
    });
  }

  // Esc 关闭，并把焦点还给汉堡按钮
  doc.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isDrawerOpen()) {
      setDrawer(false);
      var opener = doc.querySelector(".nav-toggle");
      if (opener) opener.focus();
    }
  });

  // 视口回到桌面宽度时重置抽屉状态，避免锁滚动残留
  var desktopQuery = window.matchMedia("(min-width: 1025px)");
  var onDesktopChange = function (event) {
    if (event.matches && isDrawerOpen()) {
      setDrawer(false);
    }
  };
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", onDesktopChange);
  } else if (desktopQuery.addListener) {
    desktopQuery.addListener(onDesktopChange);
  }

  /* ------------------------------------------------------------
   * 3. 平滑锚点滚动（站内 # 锚点，先收抽屉再滚动，减少动效时即时跳转）
   * ---------------------------------------------------------- */
  doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      var target = doc.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      setDrawer(false);
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      // 让锚点目标可被 Tab 到，兼顾键盘用户
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------
   * 4. 轻量入场动画：IntersectionObserver 驱动 .reveal
   * ---------------------------------------------------------- */
  var revealEls = doc.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  /* ------------------------------------------------------------
   * 5. 联系表单：本地校验 + 占位提交提示（无任何网络请求）
   * ---------------------------------------------------------- */
  var form = doc.getElementById("contact-form");
  if (form) {
    var rules = [
      {
        id: "form-name",
        test: function (value) {
          return value.trim().length >= 2;
        },
        message: "请填写姓名（至少 2 个字符）"
      },
      {
        id: "form-org",
        test: function () {
          return true;
        },
        message: ""
      },
      {
        id: "form-phone",
        test: function (value) {
          return value.trim() === "" || /^[0-9+\-() ]{5,20}$/.test(value.trim());
        },
        message: "请填写有效的联系电话（5–20 位数字）"
      },
      {
        id: "form-email",
        test: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
        },
        message: "请填写有效的电子邮箱"
      },
      {
        id: "form-intent",
        test: function (value) {
          return value !== "";
        },
        message: "请选择合作意向类型"
      },
      {
        id: "form-message",
        test: function (value) {
          return value.trim().length >= 5;
        },
        message: "请填写留言内容（至少 5 个字符）"
      }
    ];

    var errorBox = function (field) {
      return form.querySelector('[data-error-for="' + field.id + '"]');
    };

    var showError = function (field, message) {
      var box = errorBox(field);
      var input = doc.getElementById(field.id);
      if (box) {
        box.textContent = message;
        box.hidden = false;
      }
      if (input) {
        input.setAttribute("aria-invalid", "true");
        var wrapper = input.closest(".field");
        if (wrapper) wrapper.classList.add("has-error");
      }
    };

    var clearError = function (field) {
      var box = errorBox(field);
      var input = doc.getElementById(field.id);
      if (box) {
        box.textContent = "";
        box.hidden = true;
      }
      if (input) {
        input.removeAttribute("aria-invalid");
        var wrapper = input.closest(".field");
        if (wrapper) wrapper.classList.remove("has-error");
      }
    };

    var validateField = function (field) {
      var input = doc.getElementById(field.id);
      if (!input) return true;
      var ok = field.test(input.value);
      if (ok) {
        clearError(field);
      } else {
        showError(field, field.message);
      }
      return ok;
    };

    rules.forEach(function (field) {
      var input = doc.getElementById(field.id);
      if (!input) return;
      // 失焦时校验；输入时即时清除已显示的错误
      input.addEventListener("blur", function () {
        validateField(field);
      });
      input.addEventListener("input", function () {
        var wrapper = input.closest(".field");
        if (wrapper && wrapper.classList.contains("has-error")) {
          validateField(field);
        }
      });
      input.addEventListener("change", function () {
        validateField(field);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var allOk = true;
      var firstBad = null;
      rules.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = field;
        allOk = allOk && ok;
      });
      if (!allOk) {
        var badInput = doc.getElementById(firstBad.id);
        if (badInput) badInput.focus();
        return;
      }
      // 占位提交：不发出任何网络请求，仅展示“提交功能待接入”提示
      var notice = doc.getElementById("form-notice");
      if (notice) {
        notice.hidden = false;
        notice.classList.add("is-visible");
        notice.setAttribute("role", "status");
        notice.focus && notice.focus();
      }
      form.reset();
    });
  }
})();
