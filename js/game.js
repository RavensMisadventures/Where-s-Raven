
const ITEMS = ['rock','leaf','cookie','sock','feather','mouse','raven','salem','bo','willow'];
const scene = document.getElementById('scene');
const listEl = document.getElementById('find-list');

// DIFFICULTY A SETTINGS
const difficulty = 'easy'; // placeholder

// Shuffle items
const picks = ITEMS.sort(()=>Math.random()-0.5).slice(5);

// Render find-list
picks.forEach(p=>{
  const li=document.createElement('li');
  li.innerHTML = '<img src="assets/items/'+p+'.png"><br>'+p;
  listEl.appendChild(li);
});

// Place items
function placeItems(){
  picks.forEach((p,i)=>{
    const el=document.createElement('img');
    el.src='assets/items/'+p+'.png';
    el.className='hidden-item';
    el.style.width = difficulty==='easy' ? '110px' : '70px';
    el.style.left = (300 + Math.random()*800) + 'px';
    el.style.top = (100 + Math.random()*400) + 'px';
    document.body.appendChild(el);

    setTimeout(()=>{ el.classList.add('glow'); }, difficulty==='easy'? 8000:15000);
  });
}

placeItems();
