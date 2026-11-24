/* SanketSpace — local-first productivity app. No frameworks or external runtime dependencies. */
const $ = (s) => document.querySelector(s);
const storage = {
  get(key, fallback){ try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } },
  set(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Browser storage is unavailable.'); } }
};
let tasks = storage.get('ss_tasks', []);
let notes = storage.get('ss_notes', []);
let filter = 'all';
let timerSeconds = 25 * 60;
let selectedMinutes = 25;
let timerInterval = null;
let running = false;
let focusToday = storage.get('ss_focus_' + new Date().toDateString(), 0);
let toastTimeout;

function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove('show'),2200); }
function updateStats(){
  $('#totalStat').textContent=tasks.length;
  $('#doneStat').textContent=tasks.filter(t=>t.done).length;
  $('#notesStat').textContent=notes.length;
  $('#focusStat').textContent=focusToday;
}
function renderTasks(){
  const list=$('#taskList'); list.replaceChildren();
  const visible=tasks.filter(t=>filter==='all'||(filter==='active'&&!t.done)||(filter==='done'&&t.done));
  visible.forEach(task=>{
    const li=document.createElement('li'); li.className='task-row'+(task.done?' done':'');
    const check=document.createElement('input'); check.type='checkbox'; check.checked=task.done; check.setAttribute('aria-label','Complete task');
    check.addEventListener('change',()=>{task.done=check.checked;storage.set('ss_tasks',tasks);renderTasks();updateStats();});
    const label=document.createElement('span'); label.className='task-text'; label.textContent=task.text;
    const priority=document.createElement('span'); priority.className='priority '+task.priority.toLowerCase(); priority.textContent=task.priority;
    const del=document.createElement('button'); del.className='delete-button'; del.type='button'; del.textContent='×'; del.setAttribute('aria-label','Delete task');
    del.addEventListener('click',()=>{tasks=tasks.filter(t=>t.id!==task.id);storage.set('ss_tasks',tasks);renderTasks();updateStats();toast('Task deleted');});
    li.append(check,label,priority,del);list.append(li);
  });
  $('#taskEmpty').hidden=visible.length>0; updateStats();
}
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault();const input=$('#taskInput');const value=input.value.trim();if(!value)return;
  tasks.unshift({id:Date.now(),text:value,priority:$('#taskPriority').value,done:false});
  storage.set('ss_tasks',tasks);input.value='';renderTasks();toast('Task added to your list');
});
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filter=btn.dataset.filter;renderTasks();
}));
$('#clearCompleted').addEventListener('click',()=>{tasks=tasks.filter(t=>!t.done);storage.set('ss_tasks',tasks);renderTasks();toast('Completed tasks cleared');});

function renderNotes(){
  const list=$('#notesList');list.replaceChildren();
  notes.forEach(note=>{
    const item=document.createElement('article');item.className='note-item';
    const p=document.createElement('p');p.textContent=note.text;
    const del=document.createElement('button');del.type='button';del.textContent='×';del.setAttribute('aria-label','Delete note');
    del.addEventListener('click',()=>{notes=notes.filter(n=>n.id!==note.id);storage.set('ss_notes',notes);renderNotes();});
    item.append(p,del);list.append(item);
  });
  $('#notesEmpty').hidden=notes.length>0;updateStats();
}
$('#noteForm').addEventListener('submit',e=>{
  e.preventDefault();const input=$('#noteInput');const value=input.value.trim();if(!value)return;
  notes.unshift({id:Date.now(),text:value});storage.set('ss_notes',notes);input.value='';renderNotes();toast('Note saved');
});

function displayTimer(){const m=Math.floor(timerSeconds/60).toString().padStart(2,'0');const s=(timerSeconds%60).toString().padStart(2,'0');$('#timerDisplay').textContent=`${m}:${s}`;}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;running=false;$('#startTimer').textContent='Start';}
function startTimer(){
  if(running){stopTimer();$('#timerMessage').textContent='Timer paused. Resume when ready.';return;}
  running=true;$('#startTimer').textContent='Pause';$('#timerMessage').textContent='Stay with one task. You are doing great.';
  timerInterval=setInterval(()=>{
    timerSeconds--;displayTimer();
    if(timerSeconds<=0){
      stopTimer();focusToday+=selectedMinutes;storage.set('ss_focus_'+new Date().toDateString(),focusToday);
      $('#timerMessage').textContent='Session complete. Take a short break!';updateStats();toast('Focus session complete!');
    }
  },1000);
}
$('#startTimer').addEventListener('click',startTimer);
$('#resetTimer').addEventListener('click',()=>{stopTimer();timerSeconds=selectedMinutes*60;displayTimer();$('#timerMessage').textContent='Timer reset. Ready when you are.';});
document.querySelectorAll('.preset').forEach(btn=>btn.addEventListener('click',()=>{
  stopTimer();document.querySelectorAll('.preset').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  selectedMinutes=Number(btn.dataset.minutes);timerSeconds=selectedMinutes*60;displayTimer();$('#timerMessage').textContent='Ready when you are. You’ve got this.';
}));

$('#themeButton').addEventListener('click',()=>{
  document.body.classList.toggle('light');storage.set('ss_light',document.body.classList.contains('light'));
});
if(storage.get('ss_light',false))document.body.classList.add('light');
$('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
document.querySelectorAll('.side-link').forEach(link=>link.addEventListener('click',()=>{
  document.querySelectorAll('.side-link').forEach(a=>a.classList.remove('active'));link.classList.add('active');$('#sidebar').classList.remove('open');
}));
const now=new Date();
$('#todayDate').textContent=now.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
$('#year').textContent=now.getFullYear();
const hour=now.getHours();
$('#greeting').textContent=(hour<12?'Good morning':hour<17?'Good afternoon':'Good evening')+', Sanket 👋';
displayTimer();renderTasks();renderNotes();updateStats();
