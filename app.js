const app = {
    onLaunch() {
          wx.setInnerAudioOption({
              mixWithOther: !0,
              obeyMuteSwitch: !1
      })
    },
  
    quitAnimation(){
      setData({
        header:{animation_class:'header_text_animation_quit'},
        nav:{btn_class:'nav_btn_quit',animation_delay_ms:'100'},
        hero:{main_class:'main_quit'},
        footer:{text_class:'footer_text_quit'}
      })
    },
    // nextPageTransition:function(){
    //   wx.createSelectorQuery().select('.container')
    // },
    globalData: {
      header:{
        animation_class:'header_text_animation'
      },
      nav:{
        btn_class:'nav_btn',
        animation_delay_ms:'100',
      },
      hero:{
        main_class:'main'
      },
      footer:{
        text_class:'footer_text'
      },
    },
    firstLoadMetronome:true,
    noteDuration:{
      'w':96,//whole note
      'h':48,
      'hd':72,
      'q':24, //60//1000
      'qd':36,
      'e':12,
      'ed':18,
      'et':8,//eighth triplets
      's':6,//sixteenth note
      'sd':9,
      'st':4,
      //'t':3,//32nd note
      //休止符
      'qr':24,
      'qdr':36,
      'er':12,
      'edr':18,
      'sr':6,//sixteenth note
      'sdr':9,
    },
    switchDisable:false,
    slidBgColor:'#B4B2B2',
    slidHBgColor:'#B4B2B2',
    slidHdBgColor:'#B4B2B2',
    slidQdBgColor:'#B4B2B2',
    slidEdBgColor:'#B4B2B2',
    slidRBgColor:'#B4B2B2',
  
    slidDisable:true,
    slidHDisable:true,
    slidHdDisable:true,
    slidQdDisable:true,
    slidEdDisable:true,
    slidRDisable:true,
  
    slidSwitchCh:'关',
    difficulityObj:{//
      'test':{'q':5},
      'supereasy':{'h':3,'hd':3,'q':4},
      'easy':{'h':10,'hd':20,'q':30},//['h','hd','q','e'],'qr':15,
      'normal':{'h':5,'qd':15,'q':15,'e':25,},//'qr':5,'er':'5','qdr':5
      'hard':{'q':5,'qd':15,'e':25,'ed':25,'s':25},//,'qr':3,'er':3,'edr':3,'sr':'3'
      'superhard':{'q':1,'qd':1,'e':8,'ed':10,'et':8,'s':12,'st':6,},//'qr':1,'qdr':1,'er':2,'edr':2,'sr':'2'
    },
    restPrecent:3,
    customSlidValue:{
      'h':0,'hd':0,'q':0,'qd':0,'e':0,'ed':0,'et':0,'s':0,'st':0
    },
    challengeThemeObj:{
      light:[
        {id:0,name:'Normal',chname:'乌灰',a:'#fffef5',b:'#b9b9b9',c:'#000000',},
        {id:1,name:'Indigo',chname:'湛紫',a:'#fffef5',b:'#99CCFF',c:'#003366',},
        {id:2,name:'Cadet',chname:'秋松',a:'#fffef5',b:'#aaCCb5',c:'#536878',},
        {id:3,name:'Salmon',chname:'桃粉',a:'#fffef5',b:'#CC394A',c:'#DD77FA',}
    ],
      dark:[
        {id:0,name:'Normal',chname:'素白',a:'#000000',b:'#bbbbbb',c:'#fffef5',},
        {id:1,name:'GoldGray',chname:'金灰',a:'#000000',b:'#696969',c:'#ffd700',},
        {id:2,name:'DarkCyan',chname:'靛青',a:'#000000',b:'#154e5f',c:'#25e0e0',},
        {id:3,name:'Coral',chname:'嫣妃',a:'#000000',b:'#ff0505',c:'#ffaaaa',}
      ]
    },

    CookieManager:{
      /**
       * 设置 Cookie
       * @param {string} name  - Cookie 名
       * @param {string} value - Cookie 值
       * @param {number} days  - 有效期(天)
       */
      setCookie(name, value, days) {
        const date = new Date();
        // 当前时间 + days 天
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // 构造 expires
        const expires = "expires=" + date.toUTCString();
        // 使用 encodeURIComponent 对 value 进行编码
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
        // 若有需要跨子域，或只在https生效等，可以加 ";domain=xxx;secure;SameSite=Lax" 等
      },
    
      /**
       * 获取 Cookie
       * @param {string} name - 要获取的 Cookie 名
       * @returns {string}    - Cookie 的值，若不存在则返回空字符串
       */
      getCookie(name) {
        // document.cookie 形如 "user=John; exam=oBRD; myData=%7B%22..."
        // 先以 ';' 分割
        const cookieArray = document.cookie.split(";");
    
        for (let c of cookieArray) {
          // 去除前后空格
          c = c.trim();
          // 如果 c 以 "name=" 开头
          if (c.indexOf(name + "=") === 0) {
            // 截取等号后面的值，并进行解码
            return decodeURIComponent(c.substring((name + "=").length, c.length));
          }
        }
        // 没找到
        return "";
      },
    
      /**
       * 清除所有 Cookie
       * 小心使用：会删除当前域下所有 path=/ 的Cookie
       */
      clearAllCookies() {
        // 1. 分割出所有 cookie
        const cookies = document.cookie.split(";");
    
        // 2. 逐个删除
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          // 取出 cookie 名（去掉空格后，以 '=' 分割）
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
          
          // 3. 设置过期时间为一个已过去的时间点，并指定相同的 path
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/";
        }
      },
    
      /**
       * 初始化 Cookie Consent （同意/拒绝）逻辑
       * @param {string} bannerId         - 负责显示提示的容器 ID
       * @param {string} acceptBtnId      - “同意”按钮 ID
       * @param {string} rejectBtnId      - “拒绝”按钮 ID
       * @param {number} daysToExpire     - 同意或拒绝时的cookie有效期
       */
      initCookieConsent({ bannerId, acceptBtnId, rejectBtnId, daysToExpire = 30 }) {
        // 1. 获取已记录的 consent 值（可能是 'accepted'、'rejected' 或空）
        const existingConsent = this.getCookie("cookie-consent");
        const bannerEl  = document.getElementById(bannerId);
        const acceptBtn = document.getElementById(acceptBtnId);
        const rejectBtn = document.getElementById(rejectBtnId);
    
        // 若元素不存在或Cookie已存在，直接返回
        if (!bannerEl || !acceptBtn || !rejectBtn) {
          console.warn("CookieManager.initCookieConsent: 指定的元素ID不存在，或者未正确传入。");
          return;
        }
    
        // 2. 如果尚未选择过（空），弹出提示
        if (!existingConsent) {
          // 显示弹窗
          bannerEl.classList.add("show");
    
          // 3. 点击“同意” -> 设置cookie-consent=accepted
          acceptBtn.addEventListener("click", () => {
            this.setCookie("cookie-consent", "accepted", daysToExpire);
            bannerEl.classList.remove("show");
            // 如需加载统计或其他Cookie依赖的脚本，可在此调用
          });
    
          // 4. 点击“拒绝” -> 设置cookie-consent=rejected
          rejectBtn.addEventListener("click", () => {
            this.setCookie("cookie-consent", "rejected", daysToExpire);
            bannerEl.classList.remove("show");
            // 如果需要屏蔽统计、删除第三方跟踪等，可在此处理
          });
        } else {
          // 用户已做出选择
          // console.log("用户已选择 = " + existingConsent);
          // 如果需要根据选择做后续逻辑，可在此处处理
          // 例如： if (existingConsent === "accepted") { ... } else { ... }
        }
      }
    }
  }

  export const App = app