function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","G-80P17E7RZK",{cookie_flags:"SameSite=None;Secure",send_page_view:!0});const BillionairsAnalytics={trackSignup:e=>{gtag("event","sign_up",{method:"email"})},trackLogin:e=>{gtag("event","login",{method:"email"})},trackPaymentInitiated:(e,a="CHF")=>{gtag("event","begin_checkout",{currency:a,value:e,items:[{item_id:"membership",item_name:"Billionairs Luxury Membership",price:e,quantity:1}]})},trackPaymentSuccess:(e,a,t="CHF")=>{gtag("event","purchase",{transaction_id:a,currency:t,value:e,items:[{item_id:"membership",item_name:"Billionairs Luxury Membership",price:e,quantity:1}]})},trackEasterEggUnlock:e=>{gtag("event","unlock_achievement",{achievement_id:`easter_egg_${e}`,achievement_name:`${e.charAt(0).toUpperCase()+e.slice(1)} Easter Egg Unlocked`})},trackPyramidUnlock:()=>{gtag("event","unlock_achievement",{achievement_id:"pyramid_unlocked",achievement_name:"Pyramid Unlocked"})},trackEyeUnlock:()=>{gtag("event","unlock_achievement",{achievement_id:"eye_unlocked",achievement_name:"Eye Unlocked"})},trackChatReady:()=>{gtag("event","unlock_achievement",{achievement_id:"chat_ready",achievement_name:"Chat Access Unlocked"})},trackChatMessage:(e="text")=>{gtag("event","send_message",{message_type:e})},trackFileUpload:e=>{gtag("event","file_upload",{file_type:e})},trackTimeOnPage:(e,a)=>{gtag("event","user_engagement",{engagement_time_msec:1e3*e,page_name:a})},trackButtonClick:e=>{gtag("event","button_click",{button_name:e})},trackLeadGenerated:e=>{gtag("event","generate_lead",{lead_source:e})},trackAdminLogin:()=>{gtag("event","admin_login",{event_category:"admin",event_label:"CEO Access"})},trackEmergencyMode:e=>{gtag("event","emergency_mode",{event_category:"admin",event_label:e?"activated":"deactivated"})},trackError:(e,a)=>{gtag("event","exception",{description:a,fatal:!1,error_type:e})}};window.BillionairsAnalytics=BillionairsAnalytics;let lastPath=location.pathname;setInterval(()=>{location.pathname!==lastPath&&(lastPath=location.pathname,gtag("config","G-80P17E7RZK",{page_path:location.pathname}))},2e3);

/* ============================================================
   Auto-tracking layer — fires gtag for key user interactions
   ============================================================ */
(function(){
  'use strict';
  if(typeof gtag!=='function') return;

  /* 1. Scroll-Depth tracking (25%, 50%, 75%, 100%) */
  var scrollMarks={25:false,50:false,75:false,100:false};
  window.addEventListener('scroll',function(){
    var h=document.documentElement;
    var pct=Math.round((h.scrollTop/(h.scrollHeight-h.clientHeight))*100)||0;
    [25,50,75,100].forEach(function(m){
      if(pct>=m&&!scrollMarks[m]){
        scrollMarks[m]=true;
        gtag('event','scroll_depth',{percent:m,page:location.pathname});
      }
    });
  },{passive:true});

  /* 2. Language change */
  var origLang=document.documentElement.lang||'en';
  new MutationObserver(function(){
    var cur=document.documentElement.lang||'en';
    if(cur!==origLang){
      gtag('event','language_change',{from:origLang,to:cur,page:location.pathname});
      origLang=cur;
    }
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  /* 3. Form interactions */
  document.addEventListener('submit',function(e){
    var form=e.target;
    var id=form.id||form.getAttribute('name')||'unknown';
    gtag('event','form_submit',{form_id:id,page:location.pathname});
  },true);

  /* 4. Payment method selection */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-payment-method], .payment-option, #stripeCheckoutButton, #cryptoPayBtn, #wireTransferBtn');
    if(btn){
      var method=btn.getAttribute('data-payment-method')||
                 (btn.id==='stripeCheckoutButton'?'stripe':
                  btn.id==='cryptoPayBtn'?'crypto':
                  btn.id==='wireTransferBtn'?'wire':'unknown');
      gtag('event','select_payment_method',{method:method});
    }
  },true);

  /* 5. Cookie consent interaction */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('.cookie-accept, .cookie-reject, .cookie-settings, [data-cookie-action]');
    if(btn){
      var action=btn.getAttribute('data-cookie-action')||
                 (btn.classList.contains('cookie-accept')?'accept':
                  btn.classList.contains('cookie-reject')?'reject':'settings');
      gtag('event','cookie_consent',{action:action});
    }
  },true);

  /* 6. Outbound link clicks */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]');
    if(a){
      var href=a.getAttribute('href')||'';
      if(href.startsWith('http')&&!href.includes(location.hostname)){
        gtag('event','outbound_click',{url:href,link_text:(a.textContent||'').trim().substring(0,50)});
      }
    }
  },true);

  /* 7. 2FA events */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('#verifyTwofaBtn, #setup2faBtn');
    if(btn){
      var evt=btn.id==='setup2faBtn'?'2fa_setup_start':'2fa_verify_attempt';
      gtag('event',evt,{page:location.pathname});
    }
  },true);

  /* 8. NDA signing */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('#signNdaBtn, .nda-sign-button');
    if(btn){
      gtag('event','nda_sign_attempt',{page:location.pathname});
    }
  },true);

  /* 9. Contact modal open */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('#contactBtn, .contact-trigger');
    if(btn){
      gtag('event','contact_open',{page:location.pathname});
    }
  },true);

  /* 10. Time on page (fire at 30s, 60s, 180s, 300s) */
  [30,60,180,300].forEach(function(s){
    setTimeout(function(){
      gtag('event','time_on_page',{seconds:s,page:location.pathname});
    },s*1000);
  });

})();