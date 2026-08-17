(function () {
  "use strict";

  var CONFIG = {
    // Action Network — formulářový endpoint (bez potřeby API klíče, volá se přímo z prohlížeče)
    anSubmissionUrl:
      "https://actionnetwork.org/api/v2/forms/da64edd7-46a2-44c0-9b5e-3e9b9a8e3f9d/submissions/",
    campaignTag: "prazdne-byty",
    siteUrl: "https://www.prazdnebytybrno.cz/",
  };

  var variant = (window.__pbb && window.__pbb.variant) || "default";
  // Regulární výraz ze specifikace HTML pro input type="email", tedy stejný,
  // jakým adresu posuzuje sám prohlížeč. Oproti jednodušší variantě propustí
  // i adresy s plusem (opavak+klice@gmail.com), které jsou platné a lidé si
  // jimi běžně třídí poštu. Vyžadujeme navíc tečku v doméně, ať se odchytí
  // překlepy typu "jmeno@gmail".
  var emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  // ---------------------------------------------------------------------
  // Sdílený formulář — dvě umístění na stránce (nahoře/dole), jeden stav.
  // Odeslání jedné instance musí překlopit na potvrzení obě, viz zadání
  // sekce 6 a 7.
  // ---------------------------------------------------------------------

  var formState = { submitting: false, submitted: false };
  var instances = [];

  function buildFormInstance(container) {
    var template = document.getElementById("form-template");
    var fragment = template.content.cloneNode(true);
    var instanceType = container.getAttribute("data-form-instance");

    var confTop = fragment.querySelector('[data-role="confirmation-top"]');
    var confBottom = fragment.querySelector('[data-role="confirmation-bottom"]');
    var confirmation;
    if (instanceType === "top") {
      confBottom.remove();
      confirmation = confTop;
    } else {
      confTop.remove();
      confirmation = confBottom;
    }

    container.appendChild(fragment);

    var instance = {
      root: container,
      type: instanceType,
      form: container.querySelector("form"),
      emailInput: container.querySelector('[data-field="email"]'),
      emailError: container.querySelector('[data-role="email-error"]'),
      consentInput: container.querySelector('[data-field="consent"]'),
      consentError: container.querySelector('[data-role="consent-error"]'),
      honeypot: container.querySelector('[data-field="website"]'),
      submitBtn: container.querySelector('[data-role="submit"]'),
      formMessage: container.querySelector('[data-role="form-message"]'),
    };

    instance.emailInput.addEventListener("blur", function () {
      validateEmail(instance);
    });

    instance.form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSubmit(instance);
    });

    if (instanceType === "bottom") {
      wireShareButton(confirmation.querySelector('[data-share="primary"]'));
    }

    return instance;
  }

  function validateEmail(instance) {
    var val = instance.emailInput.value.trim();
    var valid = Boolean(val) && emailRegex.test(val);
    instance.emailError.classList.toggle("is-visible", !valid);
    return valid;
  }

  function setPendingUI(pending) {
    instances.forEach(function (instance) {
      instance.submitBtn.disabled = pending;
      instance.submitBtn.textContent = pending
        ? "Ukládám…"
        : "Poslat mi příručku";
    });
  }

  function showConfirmedUI(odesilajici) {
    instances.forEach(function (instance) {
      instance.root.classList.add("is-confirmed");
      // Potvrzení "Hotovo" patří k bloku, který člověk odeslal. V tom druhém
      // by se jen opakovalo, tak z něj zmizí.
      if (instance !== odesilajici) {
        instance.root.classList.add("is-druhotne");
      }
    });
  }

  // Potvrzení je nižší než formulář, takže se obsah pod ním vytáhne nahoru
  // a čtenář zůstane koukat úplně jinde. Posuneme ho zpátky na blok, který
  // odeslal, ať potvrzení vůbec uvidí.
  function ukazPotvrzeni(instance) {
    var plynule = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    instance.root.scrollIntoView({
      behavior: plynule ? "smooth" : "auto",
      block: "center",
    });
  }

  function handleSubmit(instance) {
    if (formState.submitting || formState.submitted) return;

    // Honeypot: živý člověk tohle pole nevyplní, bot ano — odeslání se tiše zahodí.
    if (instance.honeypot.value !== "") return;

    if (!instance.consentInput.checked) {
      instance.consentError.classList.add("is-visible");
      return;
    }
    instance.consentError.classList.remove("is-visible");

    if (!validateEmail(instance)) return;

    submitToActionNetwork(instance.emailInput.value.trim(), instance);
  }

  function submitToActionNetwork(email, odesilajici) {
    formState.submitting = true;
    setPendingUI(true);
    instances.forEach(function (i) {
      i.formMessage.classList.remove("is-visible");
    });

    // Tag zdroje se přidává jen u klíče a MHD, u ostatních variant zůstává
    // jen kampaňový tag prazdne-byty.
    var tags = [CONFIG.campaignTag];
    if (variant === "klic" || variant === "mhd") {
      tags.push(CONFIG.campaignTag + "-" + variant);
    }

    var body = {
      person: {
        // Na endpointu pro nepřihlášené odeslání je platný jedině stav
        // "subscribed". Souhlas máme ze zaškrtávátka ve formuláři.
        email_addresses: [{ address: email, status: "subscribed" }],
      },
      add_tags: tags,
      "action_network:referrer_data": {
        source: variant,
        referrer: document.referrer,
      },
      // Bez tohoto přepínače nemá Action Network povinnost autoresponse
      // odeslat. Řídí se pak nastavením na záložce Responses dané akce.
      triggers: { autoresponse: { enabled: true } },
    };

    fetch(CONFIG.anSubmissionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        formState.submitting = false;
        formState.submitted = true;
        showConfirmedUI(odesilajici);
        ukazPotvrzeni(odesilajici);
        if (window.umami) {
          window.umami.track("lead_submitted", { source: variant });
        }
      })
      .catch(function (err) {
        formState.submitting = false;
        setPendingUI(false);
        instances.forEach(function (i) {
          i.formMessage.classList.add("is-visible");
        });
        console.error("Odeslání do Action Network selhalo:", err);
      });
  }

  // ---------------------------------------------------------------------
  // Sdílení na závěrečném potvrzení
  // ---------------------------------------------------------------------

  function buildShareUrl() {
    return CONFIG.siteUrl + "?utm_source=share";
  }

  function wireShareButton(button) {
    if (!button) return;
    var canNativeShare = typeof navigator.share === "function";
    button.textContent = canNativeShare ? "Sdílet" : "Kopírovat odkaz";

    button.addEventListener("click", function () {
      var url = buildShareUrl();
      if (canNativeShare) {
        navigator
          .share({
            title: "Otevíráme prázdné byty v Brně",
            text: "V Brně stojí 1 592 prázdných městských bytů. Přečti si proč – a jak požádat o městský byt.",
            url: url,
          })
          .then(function () {
            trackShare("native");
          })
          .catch(function () {
            /* uživatel sdílení zrušil — nic se neděje */
          });
      } else {
        copyToClipboard(url, button);
        trackShare("copy");
      }
    });
  }

  function copyToClipboard(text, button) {
    function showCopied() {
      button.textContent = "Odkaz zkopírován";
      setTimeout(function () {
        button.textContent = "Kopírovat odkaz";
      }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied, function () {
        fallbackCopy(text);
        showCopied();
      });
    } else {
      fallbackCopy(text);
      showCopied();
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* no-op */
    }
    document.body.removeChild(textarea);
  }

  function trackShare(method) {
    if (window.umami) window.umami.track("share_click", { method: method });
  }

  // ---------------------------------------------------------------------
  // Kvíz — varianta klíč
  // ---------------------------------------------------------------------

  function initQuiz() {
    if (variant !== "klic") return;
    var buttonsWrap = document.getElementById("quiz-buttons");
    var answer = document.getElementById("quiz-answer");
    if (!buttonsWrap || !answer) return;

    var revealed = false;

    function reveal(guess) {
      if (revealed) return;
      revealed = true;
      answer.classList.add("is-visible");
      if (guess && window.umami) {
        window.umami.track("quiz_guess", { guess: guess });
      }
    }

    Array.prototype.forEach.call(
      buttonsWrap.querySelectorAll("button[data-guess]"),
      function (btn) {
        btn.addEventListener("click", function () {
          reveal(btn.getAttribute("data-guess"));
        });
      }
    );

    window.addEventListener(
      "scroll",
      function () {
        reveal(null);
      },
      { passive: true, once: true }
    );
  }

  // ---------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    var topContainer = document.getElementById("form-top");
    var bottomContainer = document.getElementById("form-bottom");

    if (topContainer) instances.push(buildFormInstance(topContainer));
    if (bottomContainer) instances.push(buildFormInstance(bottomContainer));

    initQuiz();
  });
})();
