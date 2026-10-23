import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Lumio app root not found.");
app.innerHTML = `
<div class="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_25%,rgba(255,231,173,.22),transparent_40%),linear-gradient(135deg,#fffaf0_0%,#fff7e6_100%)]">
<header class="flex min-h-[84px] items-center justify-between border-b border-[#E9E1D5] px-5 sm:px-8 lg:px-12">
<a href="#" class="flex items-center gap-3" aria-label="Lumio home"><span class="text-4xl text-[#EFB94E]">✦</span><span class="font-display text-3xl font-extrabold sm:text-4xl">Lumio</span></a>
<div class="flex items-center gap-3 text-sm sm:gap-5 sm:text-base"><span class="hidden text-[#536987] sm:inline">New to Lumio?</span><button id="create-account" class="rounded-2xl border-2 border-[#172B4D] px-4 py-2.5 font-bold transition hover:bg-[#172B4D] hover:text-white sm:px-6">Create account</button></div></header>
<main class="mx-auto grid w-full max-w-[1440px] items-center gap-8 px-5 py-8 sm:px-8 lg:min-h-[calc(100vh-84px)] lg:grid-cols-[1.04fr_.96fr] lg:gap-12 lg:px-12">
<section class="relative flex min-w-0 flex-col justify-center" aria-labelledby="welcome-title"><div class="relative z-10 mx-auto w-full max-w-[660px] lg:mx-0 lg:pl-2"><p class="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F4D7A4] bg-white/70 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.16em] text-[#8A5B16]"><span class="text-[#EFB94E]">✦</span>Your learning adventure</p><h1 id="welcome-title" class="font-display max-w-[620px] text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.75rem]">Welcome back,<br class="hidden sm:block"> little explorer!</h1><p class="mt-4 max-w-xl text-lg font-semibold leading-relaxed text-[#70819D] sm:text-xl">Your next big idea is just around the corner.</p></div>
<div class="relative mx-auto mt-5 w-full max-w-[680px] lg:mx-0 lg:mt-0"><div class="absolute left-[15%] top-[8%] aspect-square w-[72%] rounded-full bg-[#E5F1F8]/80"></div><span class="sparkle left-[4%] top-[32%] text-4xl" aria-hidden="true">✦</span><span class="sparkle left-[14%] top-[14%] text-2xl" aria-hidden="true">✧</span><span class="sparkle bottom-[21%] right-[12%] text-3xl" aria-hidden="true">✦</span><div class="absolute right-0 top-[6%] z-20 max-w-[180px] rotate-2 rounded-[2rem] border-2 border-[#F6D6A0] bg-[#FFFCF5] px-5 py-4 text-center font-display text-lg font-bold leading-tight shadow-lg sm:right-2 sm:max-w-[205px] sm:text-xl">Ready to learn something wonderful?</div><img src="/assets/lumi-hero.png" alt="Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." class="relative z-10 mx-auto block w-full max-w-[650px] object-contain drop-shadow-xl"></div><p class="mt-1 text-center text-sm font-semibold text-[#8290A7]"><span class="mx-2 text-[#EFB94E]">✦</span>Every great learner starts somewhere.<span class="mx-2 text-[#EFB94E]">✦</span></p></section>
<section class="flex w-full items-center justify-center py-2" aria-labelledby="login-title"><div class="w-full max-w-[590px] rounded-[28px] border border-[#F1D2A1] bg-white/90 p-6 shadow-[0_18px_55px_rgba(107,76,30,.08)] backdrop-blur sm:p-9 lg:p-10">
<div class="mb-7"><div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1CC] text-2xl text-[#C98B1C]" aria-hidden="true">✦</div><h2 id="login-title" class="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Let’s get learning</h2><p class="mt-2 text-base font-semibold text-[#7889A5] sm:text-lg">Sign in to continue your adventure.</p></div>
<form id="login-form" class="space-y-5" novalidate><div><label for="email" class="mb-2 block text-sm font-bold text-[#29456F] sm:text-base">Email or username</label><div class="input-shell"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-[#6C82A3]"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c.5-4 3-6 7.5-6s7 2 7.5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="email" name="email" type="text" autocomplete="username" placeholder="Enter your email or username" required class="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#9AA9C0]"></div><p id="email-error" class="mt-1 hidden text-sm font-bold text-[#B94A45]" role="alert">Please enter your email or username.</p></div>
<div><label for="password" class="mb-2 block text-sm font-bold text-[#29456F] sm:text-base">Password</label><div class="input-shell"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5 text-[#6C82A3]"><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required class="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#9AA9C0]"><button id="toggle-password" type="button" class="rounded-lg p-1 text-[#6C82A3] hover:bg-[#EEF3FA]" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" class="h-5 w-5"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.8"/></svg></button></div><p id="password-error" class="mt-1 hidden text-sm font-bold text-[#B94A45]" role="alert">Please enter your password.</p></div>
<div class="flex flex-wrap items-center justify-between gap-3 text-sm"><label class="flex cursor-pointer items-center gap-3 text-[#536987]"><input id="remember" type="checkbox" class="h-5 w-5 accent-[#172B4D]"><span class="font-semibold">Remember me</span></label><button id="forgot-password" type="button" class="font-bold text-[#174A9C] underline-offset-4 hover:underline">Forgot password?</button></div>
<button type="submit" class="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#17396F] px-5 py-3 text-lg font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#102D5A] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#EFB94E]/70"><span class="text-2xl text-[#EFB94E]" aria-hidden="true">✦</span>Sign in</button><p id="form-message" class="hidden rounded-xl px-4 py-3 text-sm font-bold" role="status" aria-live="polite"></p></form>
<div class="my-7 flex items-center gap-4 text-sm font-semibold text-[#7486A2]"><span class="h-px flex-1 bg-[#D9DFE8]"></span><span>or continue with</span><span class="h-px flex-1 bg-[#D9DFE8]"></span></div>
<button id="google-sign-in" type="button" class="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-2xl border border-[#A6B4C9] bg-white px-4 py-3 font-extrabold text-[#17396F] transition hover:border-[#17396F] hover:bg-[#F8FAFD] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#EFB94E]/60"><span class="text-2xl font-extrabold" style="color:#4285F4">G</span>Continue with Google</button>
<div class="mt-7 flex items-center justify-center gap-3 text-center text-xs font-semibold text-[#71839E]"><span class="text-xl text-[#4F9B99]" aria-hidden="true">⬟</span><span>Your learning journey is safe with us.</span></div></div></section></main>
<footer class="border-t border-[#E9E1D5] px-5 py-5 text-center text-xs font-semibold text-[#8490A4]">Made for curious minds <span class="mx-2 text-[#EFB94E]">✦</span> Learn at your own pace with Lumi.</footer></div>`;
const email = document.querySelector<HTMLInputElement>("#email")!;
const password = document.querySelector<HTMLInputElement>("#password")!;
const emailError = document.querySelector<HTMLParagraphElement>("#email-error")!;
const passwordError = document.querySelector<HTMLParagraphElement>("#password-error")!;
const message = document.querySelector<HTMLParagraphElement>("#form-message")!;
const form = document.querySelector<HTMLFormElement>("#login-form")!;
function notice(text: string, success = false): void {
  message.textContent = text;
  message.className = success ? "rounded-xl bg-[#E5F3E8] px-4 py-3 text-sm font-bold text-[#27633D]" : "rounded-xl bg-[#FCE8E6] px-4 py-3 text-sm font-bold text-[#9F302B]";
}
function clearNotice(): void { message.className = "hidden"; message.textContent = ""; }
document.querySelector<HTMLButtonElement>("#toggle-password")!.addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const show = password.type === "password";
  password.type = show ? "text" : "password";
  button.setAttribute("aria-pressed", String(show));
  button.setAttribute("aria-label", show ? "Hide password" : "Show password");
});
form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault(); clearNotice();
  const hasEmail = email.value.trim().length > 0;
  const hasPassword = password.value.length > 0;
  emailError.classList.toggle("hidden", hasEmail); passwordError.classList.toggle("hidden", hasPassword);
  email.setAttribute("aria-invalid", String(!hasEmail)); password.setAttribute("aria-invalid", String(!hasPassword));
  if (!hasEmail || !hasPassword) { notice("A little more magic is needed — fill in both fields to continue."); (!hasEmail ? email : password).focus(); return; }
  notice("The form looks good! Connect your authentication service to sign in.", true);
});
document.querySelector<HTMLButtonElement>("#forgot-password")!.addEventListener("click", () => {
  clearNotice(); if (!email.value.trim()) { notice("Enter your email or username first, and we'll help you recover access."); email.focus(); return; }
  notice("Connect this action to your reset-password flow.");
});
document.querySelector<HTMLButtonElement>("#create-account")!.addEventListener("click", () => notice("Connect this button to your Lumio sign-up page."));
document.querySelector<HTMLButtonElement>("#google-sign-in")!.addEventListener("click", () => notice("Connect Google OAuth to enable Google sign-in."));
