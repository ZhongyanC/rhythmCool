import { App } from '../app.js';
const app = App


Math.seededRandom = function(min,max) {
    max = max || 1;
    min = min || 0;
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280.0;
    var result = Math.round( min + rnd * (max - min) );
    return  result}
Math.strToSeed = function(str0){
  var seed = 0
  for(var i=0;i<str0.length; i++)
  {seed = seed+str0.charCodeAt(i)}
  // console.log(seed)
  Math.seed = seed
  return seed
}
function randomString(e) { 
  e = e || 32;
  var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
  a = t.length,
  n = "";
  for (var i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n
}
// const beatList=[3,4]
const noteDuration = app.noteDuration
var difficulityObj = app.difficulityObj//加载默认难度
var seed = randomString(8)
window.seed = seed
const defaultData = {
  difficulity: "normal",
  restPrecent:1,
  beatPerBar:"4",
  beat:"4",
  bars:"1",
  bpm:60,
  ms:1000,
  sound:'digital'
};

function bpmToMs(bpm){
  return Math.round(60000 / Number(bpm));
}

function loadUserConfig(){
  const consent = app.CookieManager.getCookie('cookie-consent');
  if(consent == 'accepted'){
    const userConfigStr = app.CookieManager.getCookie('userConfig');
    if (userConfigStr) {
      const userConfigObj = JSON.parse(userConfigStr);
      console.log('已从 Cookie 还原用户数据：', userConfigObj);
  
      return userConfigObj
    }
    else{
      saveUserConfig(defaultData)
      return  defaultData
    }
  }
  else{
    return  defaultData
  }


}

function saveUserConfig(userConfig){
  const consent = app.CookieManager.getCookie('cookie-consent');
  if(consent == 'accepted'){
    app.CookieManager.setCookie('userConfig', JSON.stringify(userConfig), 7);
  }
  else{
    return false
  }
  // console.log('已保存 Cookie，数据为：')
  // console.log(userConfig)
}

const restObj = {
  'hd':'hdr','h':'hr','qd':'qdr','q':'qr','e':'er','ed':'edr','s':'sr'
}
const restMataTrans ={
  'sr,sr,sr,sr,':'qr,',
  'sr,sr,er,':'qr,',
  'er,sr,sr,':'qr,',
  'sr,er,sr,':'qr,',
  'edr,sr,':'qr,',
  'sr,edr,':'qr,',
  'er,er,':'qr,',
  'er,sr,':'edr,',
  'sr,er,':'edr,',
  'sr,sr,sr,':'edr,',
  'sr,sr,':'er,',
  'hdr,':'qr,qr,qr,',
  'hr,':'qr,qr,'
}
const enToch = {
  'supereasy':'新手',
  'easy':'简单',
  'normal':'普通',
  'hard':'较难',
  'superhard':'困难',
  'custom':'自定义',
  1:'一',2:'二',3:'三',4:'四',5:'五',
  'light':'浅色',
  'dark':'深色',

}
const noteTranslate ={
  //休止符
  'QQQ':[
    'hdr,'
  ],
  'QQ':[
    'hr,'
  ],
  'Q':[
    'sr,sr,sr,sr,',
    'sr,sr,er,',
    'er,sr,sr,',
    'sr,er,sr,',
    'edr,sr,',
    'sr,edr,',
    'er,er,',
    'qr,'],
  'X':['er,sr,',
  'sr,er,',
  'sr,sr,sr,',
  'edr,'
  ],
  'R':['sr,sr,',
  'er,'],
  //音符
  's':'s,s,e,',
  't':'e,s,s,',
  'u':'s,e,s,',
  'v':'ed,s,',
  'w':'s,ed,',
  'o':'e,e,',
  'p':'s,s,s,s,',
  'q':'s,s,s,',
  'r':'s,s,',
  'x':'et,et,et,',
  'y':'st,st,st,',
  'A':'w,',
  'B':'h,',
  'C':'q,',
  'D':'e,',
  'E':'s,',
  'F':'t,',
  'H':'hd,',
  'I':'qd,',
  'J':'ed,',
  'K':'sd,',
  'O':'wr,',
  'P':'hr,',
  'S':'sr,',
  'T':'tr,',
  'V':'hdr,',
  'W':'qdr,',
  'Y':'sdr,',
}
function createNoteList(difficulity){
  var l =[]
  var reverse_diff = {}
  var keys = Object.keys(difficulityObj[difficulity])//['w','h']
  var values = Object.values(difficulityObj[difficulity])//[10,20]
  for(var i=0;i<keys.length;i++){
    var amount=values[i]
    if(values[i]>0){reverse_diff[noteDuration[keys[i]]] = keys[i]}
    for(var j=0;j<amount;j++){
      l.push(keys[i])
    }
  }
  // console.log(reverse_diff)
  // console.log(l)
  return {'notelist':l,'re_diff':reverse_diff}

}
function chooseNote(notelist){
    Math.seed++
    // console.log(Math.seed)
    var num = Math.seededRandom(0,notelist.length-1)
    return notelist[num]
}
function noteRule(rule_data){
  var beatPerBar = rule_data.beatPerBar
  var beat = rule_data.beat
  var notelist = rule_data.notelist
  var re_diff = rule_data.re_diff
  // console.log(Math.seed)
    var blockDuration = 96/beat
    var l=[]
    for(var i = 0;i<beatPerBar;i++){
      var p=[]
      var note= chooseNote(notelist)
      // console.log('第'+i+'次')
      // console.log(note)
      // console.log(noteDuration[note])
      var duration = noteDuration[note]
      // console.log(duration)
      var differ = blockDuration-duration
        if (duration<blockDuration){
          // console.log('小于')
          if (blockDuration%duration == 0 ){
            var is_tri = false
            var temp = blockDuration/duration
            while(true){
              temp = temp/2
              // console.log('除尽'+temp)
              if(temp == 1){var is_tri = false;break}
              if(temp<1){var is_tri = true;break}
            }
            p.push(note)
            var canBeDevideTo = differ/duration
            // console.log('能分为'+canBeDevideTo)
            var decide = Math.seededRandom(2,11)
            // console.log(is_tri)
            // console.log('摇色子是'+decide)
            if (decide>9 || is_tri){
              // console.log('补一样的')
              for(var u = 0;u<canBeDevideTo;u++){                
                p.push(note)
              }
              l.push(p)
              Math.seed++
              continue
            }
            if(decide<=9&decide>=2){
              if(canBeDevideTo>1){
                //dur=6;differ=18;canbe=3
                //dur=3;differ=21;canbe=7
                while(true){
                  var u = 0
                  if(canBeDevideTo == 0){break}
                  var bu = Math.seededRandom(1,canBeDevideTo)//4//2
                  if(bu*duration in re_diff){//12//6
                    // console.log('剩余'+canBeDevideTo)
                    p.push(re_diff[bu*duration])
                    // console.log('补的是'+re_diff[bu*duration])
                    canBeDevideTo = canBeDevideTo-bu
                    Math.seed++
                    continue
                  }                 
                }
                l.push(p)
                Math.seed++
                continue
                }
              if(canBeDevideTo=1){
                var split_2 = duration/2
                var split_3 = duration/3
                var split_4 = duration/4
                if(decide>=2&decide<=5&split_2 in re_diff){
                  for(var u = 0;u<2;u++){p.push(re_diff[split_2])}
                  // console.log('添加')
                  l.push(p)
                  Math.seed++
                  continue
                }
                if(decide>=6&decide<=7&split_3 in re_diff){
                  for(var u = 0;u<3;u++){p.push(re_diff[split_3])}
                  l.push(p)
                  Math.seed++
                  continue
                }
                if(decide>=8&decide<=9&split_4 in re_diff){
                  for(var u = 0;u<4;u++){p.push(re_diff[split_4])}
                  l.push(p)
                  Math.seed++
                  continue
                }
                else{
                  p.push(note)
                  l.push(p)
                  Math.seed++
                  continue
                }
                }
              }
            }
            if(differ in re_diff){
              p.push(note)
              p.push(re_diff[differ])
              l.push(p)
              Math.seed++
              continue
            }
            else{
              Math.seed++
              // console.log('重来')
              return noteRule(rule_data)
            }
          }
        
        if(duration==blockDuration){
          // console.log('等于')
          p.push(note)
          l.push(p)
          Math.seed++;
          continue
        }
        if(duration>blockDuration){
          // console.log('大于')
          var blockused = Math.ceil(duration/blockDuration)
          // console.log('需要占用'+blockused+'拍')
          if(blockused+i>beatPerBar){
            Math.seed++
            // console.log('重来')
            return noteRule(rule_data)
          }
          var yu = duration%blockDuration
          var decide = Math.seededRandom(1,4)
          if(yu in re_diff && decide>2){
            p.push(note)
            p.push(re_diff[yu])
            l.push(p)
            i = i+blockused-1
            Math.seed++
            continue
          }
          if(yu/2 in re_diff && decide<=2){
            p.push(note)
            p.push(re_diff[yu/2])
            p.push(re_diff[yu/2])
            l.push(p)
            i = i+blockused-1
            Math.seed++
            continue
          }
          if(yu==0){
            p.push(note)
            l.push(p)
            i = i+blockused-1
            Math.seed++
            continue
          }
          else{
            Math.seed++
            // console.log('重来')
            return noteRule(rule_data)
          }       
        }
    }
    // console.log(l)
    return l
}
function TransToFont(before,restPrecent){
  var l=''
  // console.log(before)
  for(var i = 0;i<before.length;i++){//add rest
    for(var j = 0;j<before[i].length;j++){
    Math.seed++
    var possibility = Math.seededRandom(1,10)
      if(before[i][j] in restObj && possibility<=restPrecent){
        before[i][j] = restObj[before[i][j]]
      }
    }
  }
  // console.log(before)
  for(var i = 0;i<before.length;i++){
    var s=before[i].toString()
    // console.log(s)
    s=s+','
    for(var j = 0;j<Object.values(restMataTrans).length;j++){
      var keys = Object.keys(restMataTrans)[j]
      var values = Object.values(restMataTrans)[j]
      var r = s.replaceAll(keys,values)//sr,sr,s,s,||er,s,s,
      // console.log(r)
      if(r != s){
        var t = []
        var temp = ''
        for(var k = 0;k<r.length;k++){
          if(r[k] !=','){
            temp = temp + r[k]
          }
          else{
            t.push(temp)
            temp = ''
          }
        }
        // t.push(r)
        before[i]=t
        break
      }
    }
  }
  // console.log(before)

  for(var i = 0;i<before.length;i++){
    var s=before[i].toString()//'ed,s,e,st,st,st,q,ed,s'
    s=s+','
    // console.log('---------'+s)
    for(var j = 0;j<Object.values(noteTranslate).length;j++){
      var keys = Object.keys(noteTranslate)[j]
      var values = Object.values(noteTranslate)[j]
      if(typeof values == 'object'){
        for(var k = 0; k< values.length; k++){
          var s = s.replaceAll(values[k],keys)     
        }
      }
      else{var s = s.replaceAll(values,keys)}
    }
    l = l+s
  }
  // console.log(result)
  return l
}
function main(beatData){
  if(beatData==undefined){beatData={}}
  var strSeed = beatData.seed || randomString(8)
  Math.strToSeed(strSeed)
  var difficulity = beatData.difficulity || 'normal'
  var beatPerBar = beatData.beatPerBar || 4
  var beat = beatData.beat || 4
  var restPrecent = beatData.restPrecent || 1
  var temp= createNoteList(difficulity)
  var notelist=temp['notelist']
  var re_diff =temp['re_diff']
  var rule_data = {
    'beatPerBar':beatPerBar,
    'beat':beat,
    'notelist':notelist,
    're_diff':re_diff
  }
  var before = noteRule(rule_data)
  var exam = TransToFont(before,restPrecent)
  var result = {
    'seed':strSeed,
    'difficulity':difficulity,
    'difficulityCh':enToch[difficulity],
    'timeSig':`${beatPerBar}/${beat}`,
    'examMeta':before,
    'exam':exam
  } 
  // console.log(result)
  // console.log(app.difficulityObj)
  return result
}
function createExamList(userConfig){
  const k = userConfig
  // console.log(k)
  k.seed = window.seed
  var renderList = []
  var examMetaList = []
  console.log(k.seed)
  //获得setting中玩家选择的难度
  // var selectedDifficulity = document.getElementById('difficulitySelector').value;


  for(var i=0;i<k.bars;i++)
  { 
    var seed = `${k.seed}${i}`
    var examObj = main({'seed':seed,'difficulity':k.difficulity,'beatPerBar':k.beatPerBar})
    var render = {}
    render['id'] = i
    render['exam'] = examObj.exam
    render['state'] = ''
    renderList.push(render)
    examMetaList.push(examObj)
  }

  console.log(examMetaList)
  window.examList = examMetaList
  return examMetaList
}

// [
//   { id: 0, exam: "DRIDo", state: "" },
//   { id: 1, exam: "oIRRD", state: "" },
//   { id: 2, exam: "oooQ",  state: "" },
//   { id: 3, exam: "IRoDR", state: "" }
// ]
function renderExamList(renderData) {
  const measureListContainer = document.querySelector(".measure-list");

  // ① 读取“上次条目数”（旧长度），若没有则默认 0
  const oldLength = measureListContainer.dataset.oldLength
    ? parseInt(measureListContainer.dataset.oldLength, 10)
    : 0;

  // 先清空现有内容
  measureListContainer.innerHTML = "";

  // 定义最大条目数
  const MAX_MEASURES = 6;

  for (let i = 0; i < MAX_MEASURES; i++) {
    if (i < renderData.length) {
      // 有题目的位置
      const item = renderData[i];
      const measureDiv = createMeasureDiv(item);

      // ② 只有【新添加的索引】(i >= oldLength) 才播放动画
      if (i >= oldLength) {
        measureDiv.classList.add("slide-in-right");
      }

      measureListContainer.appendChild(measureDiv);
    } else {
      // 无题目的位置，渲染加号条目
      const plusDiv = createPlusDiv();
      measureListContainer.appendChild(plusDiv);
    }
  }

  // ③ 更新“本次条目数”（新长度）
  measureListContainer.dataset.oldLength = renderData.length;

}

/**
 * 创建一个“加号”条目，用于添加新题目
 * @returns {HTMLDivElement} - 新创建的加号条目 DOM
 */
function createPlusDiv() {
  const plusDiv = document.createElement("div");
  plusDiv.classList.add("measure", "plus-measure");
  plusDiv.innerHTML = '<span class="plus-icon">+</span>';
  
  // 给加号绑定点击事件，用于添加新题目
  plusDiv.addEventListener("click", () => {
    moreBars();
  });
  
  return plusDiv;
}

/**
 * 抽出一个函数，专门用来创建 .measure 的 DOM 结构
 * @param {object} item - { id, exam, state, ... }
 * @returns {HTMLDivElement} - 新创建的 .measure DOM
 */
function createMeasureDiv(item) {
  // 1. 创建一个 .measure
  const measureDiv = document.createElement("div");
  measureDiv.classList.add("measure");

  // 2. 时间标记
  const timeSigDiv = document.createElement("div");
  timeSigDiv.classList.add("time-signature");
  timeSigDiv.textContent = "4/4"; // 或者使用 item.timeSig
  measureDiv.appendChild(timeSigDiv);

  // 3. .notes 容器
  const notesDiv = document.createElement("div");
  notesDiv.classList.add("notes");

  // 4. item.exam 逐字符渲染
  for (const char of item.exam) {
    const noteSpan = document.createElement("span");
    noteSpan.classList.add("note");
    noteSpan.textContent = char;
    notesDiv.appendChild(noteSpan);
  }
  measureDiv.appendChild(notesDiv);

  return measureDiv;
}


function createNoteIntervalMs(){
  let k = window
  // console.log(userConfig.ms)
  let quarterMs = userConfig.ms
  let proportion = quarterMs/24
  let l = []

  for(var h=0;h<k.examList.length;h++){
    k.examObj = k.examList[h]
    l.push('start')
    for(var i=0;i<k.examObj.examMeta.length;i++){
      for(var j=0;j<k.examObj.examMeta[i].length;j++){
        if(k.examObj.examMeta[i][j].indexOf('r')>0){
          l.push('r')
          l.push(noteDuration[k.examObj.examMeta[i][j]]*proportion)
        }
        else{
          l.push('p')
          l.push(noteDuration[k.examObj.examMeta[i][j]]*proportion)
        }
      }
    }
  }
  k.playInterval = l
  console.log(l)
  return l
};

function createTrueAnswerIntervalMs(){
  let k = window
  let nowtime = new Date().getTime()
  let l=[]
  let hold = []
  let timeTableList = []
  for(var i = 0; i<k.playInterval.length;i=i+2){
    if(k.playInterval[i] =='start'){
      i = i-1
      continue
    }
    if(k.playInterval[i] =='p'){
      let noteHoldTime = {}
      l.push(nowtime)
      noteHoldTime['start'] = nowtime
      nowtime = nowtime+(k.playInterval[i+1])
      noteHoldTime['end'] = nowtime
      hold.push(noteHoldTime)
    }
    if(k.playInterval[i] =='r'){
      nowtime = nowtime+(k.playInterval[i+1])
    }
  }
  // l[0]=l[0]+FBoffset
  // console.log(l)
  // console.log(hold)
  return l
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 加载所有音频样本
async function loadSounds() {
  const promises = Object.keys(soundFiles).map(async key => {
      const response = await fetch(soundFiles[key]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await loaderAudioCtx.decodeAudioData(arrayBuffer);
      audioBuffers[key] = audioBuffer;
  });

  await Promise.all(promises);
  // 关闭加载音频上下文
  await loaderAudioCtx.close();
}

// 生成节拍器点击声的函数
function playClick(audioCtx, buffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
  activeSources.push(source);

  // 当播放结束时，移除该源
  source.onended = () => {
      activeSources = activeSources.filter(s => s !== source);
  };
}

/**
 * 让元素以“高亮闪烁”动画执行一次
 * @param {HTMLElement} element 需要闪烁的元素
 * @param {number} time 本次闪烁的持续时长（毫秒）
 * @returns {Promise}
 */
function blink(element, time) {
  return new Promise((resolve) => {
    // 1) 先把 animation 设为 none，强制重置动画
    element.style.animation = 'none';
    
    // 2) 触发一次回流（reflow），以使得后续动画设置生效
    element.offsetHeight; // 读取元素尺寸或强制浏览器刷新
    
    // 3) 设置新的动画：时长为 time 毫秒，执行 1 次，结束后保持最后状态
    element.style.animation = `highlightBlink ${time/2}ms ease 1 forwards`;
    
    // 4) time 毫秒后，动画自然结束，清理动画并 resolve
    setTimeout(() => {
      // 如果需要动画结束后回到最初状态，可再设为 'none'
      // element.style.animation = 'none';
      resolve();
    }, time);
  });
}

function shadowBlink(element, time) {
  return new Promise((resolve) => {
    // 1) 先把 animation 设为 none，强制重置动画
    element.style.animation = 'none';
    
    // 2) 触发一次回流（reflow），以使得后续动画设置生效
    element.offsetHeight; // 读取元素尺寸或强制浏览器刷新
    
    // 3) 设置新的动画：时长为 time 毫秒，执行 1 次，结束后保持最后状态
    element.style.animation = `highlightShadowBlink 175ms ease 1 forwards`;
    
    // 4) time 毫秒后，动画自然结束，清理动画并 resolve
    setTimeout(() => {
      // 如果需要动画结束后回到最初状态，可再设为 'none'
      // element.style.animation = 'none';
      resolve();
    }, time);
  });
}


function resetBtnFunction(){
  document.getElementById('lastButton').disabled = false;
  document.getElementById('nextButton').disabled = false;
  document.getElementById('startButton').disabled = false;
  document.getElementById('stopButton').disabled = false;
  document.getElementById('tap-hint').removeEventListener('click', taping)
  document.getElementById('tap-hint').addEventListener('click', startTap)
  document.getElementById('startButton').removeEventListener('click', startPlay);
  document.getElementById('startButton').addEventListener('click', startPlay);

}

/**
 * 播放若干次预备拍
 * @param {AudioContext} audioCtx - 当前正在使用的 AudioContext
 * @param {number} count - 预备拍次数，默认为 4 次
 * @param {string} prepareKey - 从 audioBuffers 中取对应音频的 key，默认为 'prepare'
 */
async function playPrepare(audioCtx, count = 4, prepareKey = 'prepare') {

  const prepareBuffer = audioBuffers[prepareKey];
  if (!prepareBuffer) {
      console.warn(`未找到 key 为 "${prepareKey}" 的音频缓存，无法播放预备拍。`);
      return;
  }
  const target = Number(count)+1
  for (let i = 0; i < target; i++) {
      // 如果在播放过程中被用户停止，则直接跳出
      if (window.stopRequested) {
          console.log("播放预备拍已被用户停止。");
          return false;
      }
      if (i == 0){
        //第一次提示播放预备拍
        // 更改区域的文本
        document.getElementsByClassName("tap-text")[0].innerHTML = 'One Measure Count Down！'
        await delay(1000);
        continue
      }
      // 播放一下预备拍音频
      playClick(audioCtx, prepareBuffer);
      // 更改区域的文本为倒计时
      const remain = target-i
      document.getElementsByClassName("tap-text")[0].innerHTML = `${remain}!`
      blink(document.getElementsByClassName("tap-hint")[0],userConfig.ms)
      // 等待 interval 毫秒
      await delay(userConfig.ms);
  }
}

async function repeatShadowBlink(element, repeatTime){
  // console.log(userConfig.bpm)
  // console.log(userConfig.ms)
  for(var i=0; i<repeatTime; i++){
    if(window.stopRequested){
      break
    }
    shadowBlink(element,userConfig.ms)
    await delay(userConfig.ms)
  }
}

// 播放指令的异步函数
async function playInstructions(instructions, audioCtx, selectedSound) {
  // ========== 第一步：播放预备拍 ==========
  // 如果不需要传自定义参数，可以只写：
  // 如果想指定次数、间隔或者音频 key，可以传参数，例如：
  // await playPrepare(audioCtx, 4, 500, 'prepare');
  await playPrepare(audioCtx,userConfig.beatPerBar,selectedSound);
  
  document.getElementById('tap-hint').removeEventListener('click', startTap)
  removeHoldListener()
  document.getElementById('tap-hint').style=""
  let i = 0;
  console.log(instructions)
  var bar = 0
  while (i < instructions.length) {
      if (window.stopRequested) {
          console.log("播放已被用户停止。");
          // 关闭 AudioContext
          if (audioCtx && audioCtx.state !== 'closed') {
            try {
                await audioCtx.close();
            } catch (error) {
                console.error('关闭 AudioContext 时出错:', error);
            }
        }

        // 停止所有活跃的音频源
        activeSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                console.error('停止音频源时出错:', error);
            }
        });
        activeSources.length = 0;

        // 重置播放状态
        currentAudioCtx = null;
        await delay(1500);
        // window.stopRequested = false;
        playerAnswer = []
        trueAnswer = []
        // console.log(holdAnswer)
        holdAnswer = []
        // 恢复按钮状态
        resetBtnFunction()
        //移除长按监听
        removeHoldListener()
        return false
      }

      const command = instructions[i];
      // 跳过"start"命令
      if (command === "start") {
        repeatShadowBlink(document.querySelectorAll('.measure-list .measure')[bar],userConfig.beatPerBar)
          bar++;
          i++;
          continue;
      }

      if (command === "p" || command === "r") {
          const time = instructions[i + 1];
          i += 2; // 跳过命令和时间
          if (command === "p") {
              const buffer = audioBuffers[selectedSound];
              if (buffer) {
                  playClick(audioCtx, buffer);
                  document.getElementsByClassName("tap-text")[0].innerHTML = 'TAP！'
                  blink(document.getElementsByClassName("tap-hint")[0],time)
              }
              await delay(time);
          } else if (command === "r") {
              document.getElementsByClassName("tap-text")[0].innerHTML = 'REST！'
              await delay(time);
          }
      } else {
          i++;
      }
  }

  // 关闭 AudioContext
  if (audioCtx && audioCtx.state !== 'closed') {
      try {
          await audioCtx.close();
      } catch (error) {
          console.error('关闭 AudioContext 时出错:', error);
      }
  }

  // 停止所有活跃的音频源
  activeSources.forEach(source => {
      try {
          source.stop();
      } catch (error) {
          console.error('停止音频源时出错:', error);
      }
  });
  activeSources.length = 0;

  // 重置播放状态
  currentAudioCtx = null;
  await delay(1500);
  // window.stopRequested = false;
  // 恢复按钮状态
  resetBtnFunction()
}

async function tapInstructions(instructions, audioCtx, selectedSound) {

    await playPrepare(audioCtx,userConfig.beatPerBar,selectedSound);
    document.getElementById('tap-hint').style=""
    //加入检测taping的function 并禁用satrtTap 的引导

    document.getElementById('tap-hint').removeEventListener('click', startTap)
    addHoldListener()
    let i = 0;

    trueAnswer = createTrueAnswerIntervalMs()
    nowAnswer = 0
    // console.log(instructions)
    var bar = 0
    while (i < instructions.length) {
        if (window.stopRequested) {
            console.log("播放已被用户停止。");
            // 关闭 AudioContext
            if (audioCtx && audioCtx.state !== 'closed') {
              try {
                  await audioCtx.close();
              } catch (error) {
                  console.error('关闭 AudioContext 时出错:', error);
              }
          }

          // 停止所有活跃的音频源
          activeSources.forEach(source => {
              try {
                  source.stop();
              } catch (error) {
                  console.error('停止音频源时出错:', error);
              }
          });
          activeSources.length = 0;
          // 重置播放状态
          currentAudioCtx = null;
          // window.stopRequested = false;
          playerAnswer = []
          trueAnswer = []
          // console.log(holdAnswer)
          holdAnswer = []
          // 恢复按钮状态
          resetBtnFunction()
          //移除长按监听
          removeHoldListener()
          console.log('停')
          return false;

        }
        const command = instructions[i];
        // 跳过"start"命令
        if (command === "start") {
          repeatShadowBlink(document.querySelectorAll('.measure-list .measure')[bar],userConfig.beatPerBar)
            bar++;
            i++;
            continue;
        }

        if (command === "p" || command === "r") {
            const time = instructions[i + 1];
            i += 2; // 跳过命令和时间
            if (command === "p") {
              document.getElementsByClassName("tap-text")[0].innerHTML = ''
              await delay(time);
            }
            if (command === "r") {
              document.getElementsByClassName("tap-text")[0].innerHTML = ''
              await delay(time);
            }
        } else {
            i++;
        }
    }

    // 关闭 AudioContext
    if (audioCtx && audioCtx.state !== 'closed') {
        try {
            await audioCtx.close();
        } catch (error) {
            console.error('关闭 AudioContext 时出错:', error);
        }
    }

    // 停止所有活跃的音频源
    activeSources.forEach(source => {
        try {
            source.stop();
        } catch (error) {
            console.error('停止音频源时出错:', error);
        }
    });
    activeSources.length = 0;

    // 重置播放状态
    currentAudioCtx = null;
    // window.stopRequested = false;

    //移除长按监听
    removeHoldListener()
    //重置玩家答案数组

    await delay(userConfig.ms*2);

    //显示评价
    const rv = reviewAnswer()
    console.log(rv)
    document.querySelector('.tap-text').innerHTML=`<div class="delayText">${rv['msg']} <div class="delayDigit">${rv['avgAcu']}</div>${rv['ms_msg']}<div class="delayDigit">${rv['avgMs']}</div></div>`
    resetBtnFunction()
    playerAnswer = []
    trueAnswer = []
    // console.log(holdAnswer)
    holdAnswer = []
    // 恢复按钮状态


  }


function getTapTime(){
  let nowtime = new Date().getTime()
  return nowtime
}

let holdStartTime = 0

function holdStartTimeHandle(){ //处理用户点下的时的事件
  let selectedSound = document.getElementById('soundSelector').value;
  playClick(currentAudioCtx,audioBuffers[selectedSound])
  holdStartTime = new Date().getTime()
  playerAnswer.push(holdStartTime)
  document.getElementById('tap-hint').classList.add('active');
  realTimeReview(realCalaulateLatency())

}

let holdEndTime = 0
let holdAnswer = []

function holdEndTimeHandle(){
  console.log('end!')
  let thisHold = {}
  holdEndTime = new Date().getTime()
  thisHold['start'] = holdStartTime
  thisHold['end'] = holdEndTime
  holdAnswer.push(thisHold)
  document.getElementById('tap-hint').classList.remove('active');
}


function addHoldListener(){
  // 获取目标元素
  const targetElement = document.getElementById('tap-hint');
  // 触摸或鼠标按下时记录时间
  const isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchSupported) {
    targetElement.addEventListener('touchstart', holdStartTimeHandle, false);
    targetElement.addEventListener('touchend', holdEndTimeHandle);
  } else {
    targetElement.addEventListener('mousedown', holdStartTimeHandle, false);
    targetElement.addEventListener('mouseup', holdEndTimeHandle);
  }
  // 触摸或鼠标释放时计算时间


  // 如果触摸或鼠标按下时取消
  // targetElement.addEventListener('mouseleave',holdEndTimeHandle);
  // targetElement.addEventListener('touchcancel', holdEndTimeHandle);
}

function removeHoldListener(){
  // 获取目标元素
  const targetElement = document.getElementById('tap-hint');
  // 触摸或鼠标按下时记录时间
  targetElement.removeEventListener('mousedown', holdStartTimeHandle);
  targetElement.removeEventListener('touchstart',holdStartTimeHandle);
  // 触摸或鼠标释放时计算时间
  targetElement.removeEventListener('mouseup', holdEndTimeHandle);
  targetElement.removeEventListener('touchend', holdEndTimeHandle);
  // 如果触摸或鼠标按下时取消
  targetElement.removeEventListener('mouseleave',holdEndTimeHandle);
  targetElement.removeEventListener('touchcancel', holdEndTimeHandle);
}

function caculateLatency(){
  if(playerAnswer.length<trueAnswer.length){
    var answerLength = playerAnswer.length
  }
  else {
    var answerLength = trueAnswer.length
  }
  var delaySum = 0

  // const allowFirstBeatOffset = 150
  for(var i = 0; i<answerLength; i++){
    if(i == 0){//补偿第一拍的延迟
      const delay = Math.abs(playerAnswer[i] - trueAnswer[i])
      delaySum += delay/3 //缩小第一拍延迟3倍
      continue
    }
    const delay = Math.abs(playerAnswer[i] - trueAnswer[i])
    delaySum += delay
  }
  const avgDelay = Math.floor(delaySum/answerLength)
  return avgDelay
}

function reviewAnswer(){
  const avgDelay = caculateLatency()
  const avgAccuracy = (100-((avgDelay/userConfig.ms)*100)).toFixed(1)
  if(playerAnswer.length<trueAnswer.length){
    return {
      'msg':'Not enough notes!',
      'avgMs':``,
      'avgAcu':``,
      'ms_msg':'',
    }
  }
  if(playerAnswer.length==trueAnswer.length){
    return {
      'msg':'Good job! Your average accuracy is',
      'avgMs':`${avgDelay}ms`,
      'avgAcu':`%${avgAccuracy}`,
      'ms_msg':'Your average delay is',
    }
  }
  if(playerAnswer.length>trueAnswer.length){
    return {
      'msg':'Too much notes!',
      'avgMs':``,
      'avgAcu':``,
      'ms_msg':'',
    }
  }
}


// 全局变量来控制播放状态
    window.stopRequested = false;
let currentAudioCtx = null;
let activeSources = [];

// 预加载音频样本
const soundFiles = {
  "digital": "../sounds/db0.mp3", // 示例数字节拍器声音
  "mechanical": "../sounds/db1.mp3" // 示例机械节拍器声音
  // 可以添加更多的音频样本
};

const audioBuffers = {};

// 创建音频上下文
const AudioContext = window.AudioContext || window.webkitAudioContext;
const loaderAudioCtx = new AudioContext();


async function loadAndPlayInstruction(tap = false) {
    // 获取用户选择的声音
    const selectedSound = document.getElementById('soundSelector').value;
    window.stopRequested = false;
    // 创建新的 AudioContext
    const audioCtx = new AudioContext();
    currentAudioCtx = audioCtx;
  
    try {
        // 恢复音频上下文（某些浏览器需要用户交互才能启动音频）
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
  
        // 禁用“开始播放”按钮，启用“停止播放”按钮
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        createNoteIntervalMs()
        // 开始播放指令或者tap
        if(tap){
          await tapInstructions(window.playInterval, audioCtx, selectedSound)
        }
        else{
          await playInstructions(window.playInterval, audioCtx, selectedSound);
        }
        
    } catch (error) {
        console.error('播放过程中出现错误:', error);
        // 发生错误时，确保 AudioContext 被关闭
        if (audioCtx.state !== 'closed') {
            try {
                await audioCtx.close();
            } catch (closeError) {
                console.error('关闭 AudioContext 时出错:', closeError);
            }
        }
  
        // 停止所有活跃的音频源
        activeSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                console.error('停止音频源时出错:', error);
            }
        });
        activeSources.length = 0;
  
        // 恢复按钮状态
        document.getElementById('startButton').disabled = false;
        document.getElementById('stopButton').disabled = true;

        //重置玩家答案数组
        playerAnswer = []
        trueAnswer = []
    }
}

function startTap(){
  loadAndPlayInstruction(true)
  document.getElementById('tap-hint').removeEventListener('click', startTap)

  //测试时禁止播放
  document.getElementById('startButton').removeEventListener('click', startPlay);
}

let playerAnswer = []
let trueAnswer = []
function taping(){
  playerAnswer.push(getTapTime())
  // blink(document.getElementsByClassName("tap-hint")[0],100)
  console.log(playerAnswer)
}



function startPlay(){
  createNoteIntervalMs()
  loadAndPlayInstruction()
  //播放时禁止测试
  document.getElementById('tap-hint').removeEventListener('click', startTap);
}
// 绑定“开始播放”按钮点击事件
document.getElementById('startButton').addEventListener('click', startPlay);

document.getElementById('tap-hint').addEventListener('click', startTap);

// 绑定“停止播放”按钮点击事件
document.getElementById('stopButton').addEventListener('click', async () => {
  
      // 请求停止播放
      window.stopRequested = true;
      removeHoldListener()
      // 尝试关闭当前的 AudioContext
      try {
          await currentAudioCtx.close();
      } catch (error) {
          console.error('关闭 AudioContext 时出错:', error);
      }

      // 停止所有活跃的音频源
      activeSources.forEach(source => {
          try {
              source.stop();
          } catch (error) {
              console.error('停止音频源时出错:', error);
          }
      });
      activeSources.length = 0;

      // 重置播放状态

      currentAudioCtx = null;
      //清除动画和文字
      const tapHintEl = document.querySelector('.tap-hint');
      // 将 animation 设置为 none，即可停止动画
      tapHintEl.style.animation = 'none';
      document.querySelector('.tap-text').innerHTML="Tap here to test your accuracy!"

      // 恢复按钮状态
      document.getElementById('startButton').disabled = false;
      document.getElementById('stopButton').disabled = true;
      document.getElementById('tap-hint').addEventListener('click', startTap)
      console.log("播放已被用户停止。");

      //重置玩家答案数组
      playerAnswer = []
      trueAnswer = []
      setGrade('')
  
});

// 在页面加载时预加载音频样本
window.addEventListener('load', async () => {
  try {
      await loadSounds();
      console.log("所有音频样本已加载完成。");
  } catch (error) {
      console.error("加载音频样本时出错:", error);
  }
});

// 简单事件：动态显示 BPM 数值
const bpmRange = document.getElementById("bpmRange");
const bpmValue = document.getElementById("bpmValue");

bpmRange.addEventListener("input", () => {
  bpmValue.textContent = bpmRange.value;
  userConfig.bpm = bpmRange.value
  userConfig.ms = bpmToMs(bpmRange.value)
  saveUserConfig(userConfig)
});






function cleanExamAnimation(){
  const measureListContainer = document.querySelector(".measure-list");
  measureListContainer.innerHTML = "";
  measureListContainer.removeAttribute("data-old-length");
}


export function moreBars() {
  if (userConfig.bars == 6) {
  }
  if (userConfig.bars < 6) {
    userConfig.bars++;
  } else {
    userConfig.bars = 1;
  }
  // 重新生成数据
  // console.log(window.seed)
  window.seed = examHistory[examIndex][0].seed.slice(0, -1)
  const data = createExamList(userConfig);
  // 局部更新渲染
  renderExamList(data);
  createNoteIntervalMs()
  examHistory[examIndex] = data
  saveUserConfig(userConfig);
}



var examHistory = []
var examIndex = 0


function lastExam(){
  examIndex = examHistory.indexOf(window.examList)
  if(examIndex != 0){
    cleanExamAnimation()
    examIndex--
    renderExamList(examHistory[examIndex])
    window.examList = examHistory[examIndex]
    createNoteIntervalMs()
    document.getElementsByClassName('examNumber')[0].innerText=examIndex+1
  }
  else{
    return false
  }
}

function nextExam() {
  console.log('examHistory.length'+examHistory.length)
  console.log('nowExam'+(examIndex+1))
  if(examHistory.length-1 == examIndex){
    //历史中没有的话生成一条新的
    window.seed = randomString(8);
    const data = createExamList(userConfig);
  
    // 如果你想所有条目都重新动画，可以先清空：
    cleanExamAnimation()
    // 再渲染所有条目，这时都会算“新条目”
    renderExamList(data);
    createNoteIntervalMs()
    examHistory.push(data)
    examIndex++
    console.log(examHistory)
    document.getElementsByClassName('examNumber')[0].innerText=examIndex+1
  }
  else{
    cleanExamAnimation()
    examIndex++
    renderExamList(examHistory[examIndex])
    window.examList = examHistory[examIndex]
    createNoteIntervalMs()
    document.getElementsByClassName('examNumber')[0].innerText=examIndex+1
  }


}
//给‘下一条’加上点击监听
document.getElementById('nextButton').addEventListener('click',nextExam)
document.getElementById('lastButton').addEventListener('click',lastExam)
window.moreBars = moreBars;



//设置相关
const openBtn = document.getElementById('settingButton');
const closeBtn = document.getElementById('closeButton');
const settingModal = document.getElementById('settingModal');
const mainContent = document.getElementById('mainContent');

/* 打开弹窗：只需添加 .active，去掉 .closing（如果之前有） */
function openSetting() {
  // 读取userconfig的数据
  // 难度
  document.getElementById("soundSelector").value = userConfig.sound
  document.getElementById("difficulitySelector").value = userConfig.difficulity
  document.getElementById("barsSelector").value = userConfig.bars
  document.getElementById("cookieSelector").value = app.CookieManager.getCookie('cookie-consent')
  // 移除可能残留的 .closing
  settingModal.classList.remove('closing');
  // 给弹窗加上 .active
  settingModal.classList.add('active');
  mainContent.classList.add('blur');
}

function closeSetting() {
  document.getElementById('difficulityText').innerText=userConfig.difficulity
  //渲染新设置的画面
  window.seed = examHistory[examIndex][0].seed.slice(0, -1)
  const data = createExamList(userConfig);
  // 局部更新渲染
  renderExamList(data);
  createNoteIntervalMs()
  examHistory[examIndex] = data
  //更新cookie
  saveUserConfig(userConfig)

  // 先播放退场动画
  settingModal.classList.add('closing');

  // 等退场动画结束后，再真正隐藏
  const onAnimationEnd = () => {
    settingModal.classList.remove('active');
    settingModal.classList.remove('closing');

    // 移除 mainContent 的 blur
    mainContent.classList.remove('blur');

    settingModal.removeEventListener('animationend', onAnimationEnd);
  };

  settingModal.addEventListener('animationend', onAnimationEnd, { once: true });
}

//更新cookies和设置
document.getElementById('soundSelector').addEventListener('change', () => {
  userConfig.sound = document.getElementById('soundSelector').value;
  saveUserConfig(userConfig);
});
document.getElementById('difficulitySelector').addEventListener('change', () => {
  userConfig.difficulity = document.getElementById('difficulitySelector').value;
  saveUserConfig(userConfig);
});
document.getElementById('barsSelector').addEventListener('change', () => {
  userConfig.bars = document.getElementById('barsSelector').value;
  saveUserConfig(userConfig);
});

document.getElementById('cookieSelector').addEventListener('change', () => {
  const cookieConsent = document.getElementById('cookieSelector').value;
  app.CookieManager.setCookie("cookie-consent", cookieConsent, 30);
});



// 3. 使用 addEventListener 监听点击事件
openBtn.addEventListener('click', openSetting);
closeBtn.addEventListener('click', closeSetting);

// 如果你有其他需求，比如点击空白处关闭弹窗，也可以再写一个事件监听：
settingModal.addEventListener('click', (event) => {
  // 若点击的是 modal 本身（而非 .setting-content 内容区域），则关闭
  if (event.target === settingModal) {
    closeSetting();
  }
});

const tips = [
  'Tap "<text class="fa fa-step-forward fa"></text>" to creat a new test!',
  'You do not need to hold for long notes!',
  'Tap "<text class="fa fa-play fa"></text>" play the example of this test!',
  'Tap "<text class="fa fa-step-backward fa"></text>" to review your tests！',
  'Slide the BPM bar to choose a suitable tempo!',
  'Tap "<text class="fa fa-stop fa"></text>" to stop the test or example!',
  'Always look ahead to the next bar!',
  'Counting out louadly will help you!',
]
async function showTips(tips){

  const tipEl = document.getElementsByClassName('tips')[0];
  var i = 0
  while (true) {
    // 先淡出
    tipEl.classList.add('hide');
    // 等待淡出动画结束（这里等待和 transition 时间要相匹配）
    await delay(600);

    // 更新文本
    tipEl.innerHTML = `TIPS: ${tips[i]}`;

    // 再淡入
    tipEl.classList.remove('hide');

    // 下一个循环前等一段时间，再次淡出
    i = (i + 1) % tips.length;
    // 等待若干秒后继续下一次（这里表示停留展示文本时间）
    await delay(3500);
  }
}

function setGrade(inputVal) {
  const gradeElem = document.getElementById('gradeDisplay');

  // 先全部清空
  gradeElem.className = ''; 
  gradeElem.style.display = 'none';

  // 如果空值就不显示，直接返回
  if (!inputVal) return;

  // 判断输入
  switch (inputVal) {
    case 'SS':
      gradeElem.classList.add('grade-splus');
      gradeElem.textContent = 'Perfect!!';
      break;
    case 'S':
      gradeElem.classList.add('grade-s');  // 新增的 S 等级
      gradeElem.textContent = 'Great!';
      break;
    case 'A':
      gradeElem.classList.add('grade-a');
      gradeElem.textContent = 'Good!';
      break;
    case 'B':
      gradeElem.classList.add('grade-b');
      gradeElem.textContent = 'Not Bad';
      break;
    case 'C':
      gradeElem.classList.add('grade-c');
      gradeElem.textContent = 'Miss';
      break;
    case 'D':
      gradeElem.classList.add('grade-d');
      gradeElem.textContent = 'Miss';
      break;
    default:
      // 这里也可以选择直接 return，不显示任何东西
      gradeElem.textContent = '';
      break;
  }

  // 显示元素
  gradeElem.style.display = 'block';

  // 触发 pop-up 动画
  // 先强行让浏览器回流（reflow），以保证每次都能重新触发动画
  void gradeElem.offsetWidth; 
  // 再添加 popUp 类
  gradeElem.classList.add('popUp');
}


var gradeId = 0
document.getElementById("headerText").addEventListener('click', () =>{
  const grade = ['S+','S','A','B','C','D','']
  setGrade(grade[gradeId])
  gradeId++
  if(gradeId == grade.length){
    gradeId = 0
  }
})

let nowAnswer = 0
function realCalaulateLatency(){
  // console.log(trueAnswer)

  var delay = playerAnswer[nowAnswer] - trueAnswer[nowAnswer]
  if(nowAnswer == 0){
    for(var j = 0; j<trueAnswer.length; j++){ // 前4音符的容差
      trueAnswer[j] = trueAnswer[j] + delay
    }
    nowAnswer++
    return delay/3
  }
  nowAnswer++
  return delay
}

const diffStandar = {
  'supereasy':18000,
  'easy':21000,
  'normal':24000,
  'hard':27000,
  'superhard':30000
}

function realTimeReview(latency){
  const standar = diffStandar[userConfig.difficulity]/userConfig.ms
  const absLatency = Math.abs(latency)

  if (absLatency < standar) {
    setGrade('SS')
  } else if (standar < absLatency && absLatency < standar * 2) {
    setGrade('S')
  } else if (standar * 2 < absLatency && absLatency < standar * 4) {
    setGrade('A')
  } else if (standar * 4 < absLatency && absLatency < standar * 8) {
    setGrade('B')
  } else if (standar * 8 < absLatency && absLatency < standar * 16) {
    setGrade('C')
  } else if (absLatency > standar * 16) {
    setGrade('D')
  }
}

function pageLoad(userConfig){
  document.addEventListener("DOMContentLoaded", () => {
    app.CookieManager.initCookieConsent({
      bannerId:    "cookieConsent",    // 与上面HTML中 <div id="cookieConsent"> 对应
      acceptBtnId: "cookieAcceptBtn",  // “同意”按钮的 ID
      rejectBtnId: "cookieRejectBtn",  // “拒绝”按钮的 ID
      daysToExpire: 30                // Cookie有效期，默认30天
    });
  });
  document.getElementsByClassName('examNumber')[0].innerText=examIndex+1
  const data = createExamList(userConfig);
  const cookieConsent = app.CookieManager.getCookie("cookie-consent");
  document.getElementById('difficulityText').innerText=userConfig.difficulity
  document.getElementById('timeSigText').innerText=`(${userConfig.beatPerBar}/${userConfig.beat})`
  document.getElementById('bpmRange').value=userConfig.bpm
  document.getElementById('barsSelector').value=userConfig.bars
  document.getElementById('cookieSelector').value=cookieConsent
  document.getElementById('bpmValue').innerText=userConfig.bpm
  // 如果你想所有条目都重新动画，可以先清空：
  const measureListContainer = document.querySelector(".measure-list");
  measureListContainer.innerHTML = "";

  // 再渲染所有条目，这时都会算“新条目”
  renderExamList(data);
  createNoteIntervalMs()
  // console.log(createTrueAnswerIntervalMs())
  examHistory.push(data)
  showTips(tips)
}

var userConfig = loadUserConfig()
console.log(userConfig)
pageLoad(userConfig)



