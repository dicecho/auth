import { getTranslator, type Locale, DEFAULT_LOCALE, isValidLocale } from "./i18n";

/**
 * Email verification template
 */
export const verifyEmailTemplate = (link: string, locale?: string) => {
  const validLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = getTranslator(validLocale);

  return `
<div style="position: relative; color: rgba(255, 255, 255, 0.65); padding: 32px; background: #283241;">
  <div
    class="esd-block-image"
    align="center"
    style="font-size: 0px; padding: 5px 0px;"
  >
    <img
      src="https://dicetower.oss-cn-heyuan.aliyuncs.com/images/logo.png"
      alt
      style="display: block;"
      width="175"
    />
  </div>

  <div align="center" class="esd-block-text" style="padding: 10px 0px;">
      <h1 style="color: #fff">${t("email.verification.welcome")}</h1>
  </div>

  <div class="esd-block-text" align="center" style="padding: 10px 30px 20px;">
      <p>${t("email.verification.body")}</p>
  </div>

  <div class="esd-block-button" align="center" style="padding: 10px 0px 20px;">
    <span class="es-button-border" style="border-width: 0px; border-style: solid; background: #9396f7; border-color: #26a4d3;">
      <a href="${link}" class="es-button" target="_blank" style="background: #9396f7; border-color: #9396f7; color: white; padding: 8px 16px; border-radius: 5px; text-decoration: none;">
        ${t("email.verification.button")}
      </a>
    </span>
  </div>

  <div
style="width: 100%; display: flex; align-items: center; justify-content: center;"
>
   <p style="font-size: 14px;">
     ${t("email.common.contactUs")}
     <a
       target="_blank"
       href="mailto:info@dicecho.com"
       style="font-size: 14px; color: #fff;"
       >info@dicecho.com</a
     >
   </p>
 </div>
</div>
`;
};

/**
 * Password reset template
 */
export const resetPasswordTemplate = (
  nickname: string,
  link: string,
  locale?: string
) => {
  const validLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = getTranslator(validLocale);

  return `
<div
  class="es-content-body"
  style="background-color: #283241; color: rgba(255, 255, 255, 0.65); padding: 32px;"
  width="600"
  cellspacing="0"
  cellpadding="0"
  align="center"
>
<div
  class="esd-block-image es-p5t es-p5b"
  align="center"
  style="font-size: 0px; padding: 5px 0px;"
>
  <img
    src="https://dicetower.oss-cn-heyuan.aliyuncs.com/images/logo.png"
    alt
    style="display: block;"
    width="175"
  />
</div>

<div class="esd-block-text" align="center" style="padding-top: 15px; padding-bottom: 15px;">
  <h1 style="color: #fff; font-size: 20px;">
    <b>${t("email.resetPassword.title")}</b>
  </h1>
</div>

<div
  class="esd-block-text"
  style="padding-top: 25px; padding-right: 40px; padding-left: 40px;"
  align="center"
>
  <p>
    ${t("email.resetPassword.body", { nickname })}
  </p>
</div>

  <div
    class="esd-block-button"
    style="padding: 40px 10px;"
    align="center"
  >
    <span
      class="es-button-border es-button-border-1615565126948"
      style="border-color: #9396f7; border: 1px solid #9396f7; padding: 8px 16px; border-radius: 5px;"
      ><a
        href="${link}"
        class="es-button"
        target="_blank"
        style="color: #9396f7; text-decoration: none;"
        >${t("email.resetPassword.button")}</a
      ></span
    >
  </div>

  <div
   style="width: 100%; display: flex; align-items: center; justify-content: center;"
  >
    <p style="font-size: 14px;">
      ${t("email.common.contactUs")}
      <a
        target="_blank"
        href="mailto:info@dicecho.com"
        style="font-size: 14px; color: #fff;"
        >info@dicecho.com</a
      >
    </p>
  </div>
</div>
`;
};

/**
 * Get email subject for verification email
 */
export const getVerificationEmailSubject = (locale?: string): string => {
  const validLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = getTranslator(validLocale);
  return t("email.verification.subject");
};

/**
 * Get email subject for password reset email
 */
export const getResetPasswordEmailSubject = (locale?: string): string => {
  const validLocale: Locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = getTranslator(validLocale);
  return t("email.resetPassword.subject");
};
