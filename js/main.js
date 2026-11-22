(function(){
  "use strict";
  var lakeView   = document.getElementById('lakeView');
  var insideView = document.getElementById('insideView');
  var hero       = document.getElementById('hero');
  var heroZoom   = document.getElementById('heroZoom');
  var heroUi     = document.getElementById('heroUi');
  var lantern    = document.getElementById('lanternHotspot');
  var lanternCore= document.getElementById('lanternCore');
  var buildPill  = document.getElementById('buildPill');
  var backBtn    = document.getElementById('backBtn');
  var track      = document.getElementById('roomsTrack');
  var fill       = document.getElementById('progressFill');
  var room1      = document.getElementById('room1');
  var room2      = document.getElementById('room2');
  var img1       = room1.querySelector('.room-img img');
  var img2       = room2.querySelector('.room-img img');
  var title1     = room1.querySelector('.room-title');
  var title2     = room2.querySelector('.room-title');
  var reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inside     = false;
  var entering   = false;

  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
  function smooth(t){ return t * t * (3 - 2 * t); }

  /* ---------- enter: lantern zoom, then crossfade ---------- */
  function enter(){
    if (inside || entering) return;
    entering = true;
    var hr = hero.getBoundingClientRect();
    var lr = lanternCore.getBoundingClientRect();
    var ox = ((lr.left + lr.width / 2) - hr.left) / hr.width * 100;
    var oy = ((lr.top + lr.height / 2) - hr.top) / hr.height * 100;
    heroZoom.style.transformOrigin = ox.toFixed(2) + '% ' + oy.toFixed(2) + '%';
    heroUi.classList.add('faded');
    heroZoom.classList.add('zooming');
    setTimeout(function(){
      insideView.classList.add('active');
      insideView.setAttribute('aria-hidden', 'false');
      lakeView.classList.add('gone');
      inside = true;
      onScroll();
    }, 1250);
    setTimeout(function(){
      heroZoom.classList.add('noanim');
      heroZoom.classList.remove('zooming');
      heroZoom.style.transform = '';
      setTimeout(function(){ heroZoom.classList.remove('noanim'); }, 60);
      entering = false;
    }, 1750);
  }
  lantern.addEventListener('click', enter);
  lantern.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
  });
  buildPill.addEventListener('click', enter);

  /* ---------- back to the lake ---------- */
  function back(){
    if (!inside) return;
    inside = false;
    lakeView.classList.remove('gone');
    heroUi.classList.remove('faded');
    setTimeout(function(){
      insideView.classList.remove('active');
      insideView.setAttribute('aria-hidden', 'true');
      insideView.scrollTop = 0;
      onScroll();
    }, 120);
  }
  backBtn.addEventListener('click', back);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      if (typeof window.__ardmereCloseSheet === 'function' && window.__ardmereSheetOpen) { window.__ardmereCloseSheet(); return; }
      back();
    }
  });

  /* ---------- scroll camera: 70% travel, 30% hold ---------- */
  function renderRoom(img, title, t, dir, fadeOut){
    var travel = easeOut(clamp(t / 0.7, 0, 1));
    var scale  = 1.18 - 0.15 * travel;
    var tx     = dir * (1 - travel) * -2.5;
    img.style.transform = 'scale(' + scale.toFixed(4) + ') translateX(' + tx.toFixed(3) + '%)';
    var hold = smooth(clamp((t - 0.7) / 0.2, 0, 1));
    var op = hold * (1 - fadeOut);
    title.style.opacity = op.toFixed(3);
    title.style.transform = 'translateY(' + ((1 - hold) * 16).toFixed(1) + 'px)';
  }

  function onScroll(){
    var vh = insideView.clientHeight || window.innerHeight;
    var total = Math.max(1, track.offsetHeight - vh);
    var p = clamp(insideView.scrollTop / total, 0, 1);
    fill.style.width = (p * 100).toFixed(2) + '%';

    var t1 = clamp(p / 0.5, 0, 1);
    var t2 = clamp((p - 0.5) / 0.5, 0, 1);
    var cf = smooth(clamp((t2 / 0.7) / 0.4, 0, 1));   // room2 crossfade window
    room2.style.opacity = cf.toFixed(3);
    var blur = Math.sin(cf * Math.PI) * 5;
    img1.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
    renderRoom(img1, title1, t1, 1, cf);
    renderRoom(img2, title2, t2, -1, 0);
  }
  insideView.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- finale reveals + wireframe draw ---------- */
  var wire = document.getElementById('wireHouse');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      en.target.classList.add('shown');
      if (en.target.contains(wire) || en.target === wire) wire.closest('figure').classList.add('drawn');
      io.unobserve(en.target);
    });
  }, { root: insideView, threshold: 0.25 });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  var wireObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('drawn'); wireObs.unobserve(en.target); }
    });
  }, { root: insideView, threshold: 0.35 });
  wireObs.observe(wire.closest('figure'));

  /* ---------- gentle parallax on the hero layers ---------- */
  if (!reduced && window.matchMedia('(pointer: fine)').matches){
    var bg = document.getElementById('layerBg');
    var houses = document.getElementById('layerHouses');
    var word = document.getElementById('wordLayer');
    var tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener('mousemove', function(e){
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    (function loop(){
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      if (!entering && !inside){
        bg.style.transform = 'translate(' + (cx * -8).toFixed(2) + 'px,' + (cy * -5).toFixed(2) + 'px)';
        houses.style.transform = 'translate(' + (cx * 5).toFixed(2) + 'px,' + (cy * 3).toFixed(2) + 'px)';
        word.style.marginLeft = (cx * 3).toFixed(2) + 'px';
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Room detail sheet ---------- */
  var ROOMS = {
    great: {
      kicker: "Room 01, The gathering room",
      code: "Room code ARD-GR-01 · South to the lake · Gathering level",
      title: "The Great Room",
      line: "Firelight, tall glass, and the blue hour held outside.",
      img: "img/room-great.jpg",
      alt: "The Great Room: a living room with a stone fireplace, tall windows on the deep blue night, and a cream sofa.",
      what: "The gathering heart of the house and the first room the scroll camera settles in. One open room for sitting, talking and watching the lake turn dark, built around a stone fireplace and a full wall of tall glass facing the water.",
      features: [
        "Stone fireplace centred on the inner wall, with a deep hearth for sitting close",
        "Tall glass wall facing south to the lake, in three wide panes",
        "Cream sofa and low chairs arranged in a loose circle around the fire, not facing a screen",
        "Timber ceiling beams and a warm wood floor that carries the firelight",
        "Reading lamps at both ends of the sofa, on dimmers for the blue hour",
        "A wide, low threshold to the shore terrace, so the room opens straight to the water in summer"
      ],
      data: [["Floor size", "7.2 m by 5.4 m"], ["Floor area", "About 39 sq m"], ["Ceiling height", "3.6 m at the ridge"], ["Glass wall", "6.0 m wide, south"], ["Fireplace", "Stone, wood burning"], ["Seats", "6 to 8 people"], ["Orientation", "South, to the lake"], ["Light", "Dusk first, lamps second"]],
      idea: "This room carries the first idea of the finale: light first. Glass faces the water and the room is placed for the hour when the lake turns blue, while the warm life of the house, the fire and the seating, sits just behind that glass. It is also where the plan begins: arrive, then gather here, before anyone retreats."
    },
    study: {
      kicker: "Room 02, The retreat room",
      code: "Room code ARD-ST-02 · South west to the mountain · End of the plan",
      title: "The Study",
      line: "Books, lamplight, and the mountain across the water.",
      img: "img/room-study.jpg",
      alt: "The Study: bookshelves, a desk and lamp, and one large window over the mountain lake.",
      what: "The quiet end of the house and the second room on the scroll journey. A single person room for reading and work, lined with books, with one large window that frames the mountain across the lake like a picture that changes with the weather.",
      features: [
        "Floor to ceiling bookshelves along the inner wall, with a ladder rail",
        "A wide desk set directly under the large lake window",
        "One large window only, framing the mountain across the water",
        "A brass desk lamp and a low reading chair with a side table",
        "A solid door and a thick rug, so the room stays quiet when the Great Room is full",
        "No through route: the study is an end room, entered on purpose and left on purpose"
      ],
      data: [["Floor size", "4.8 m by 3.6 m"], ["Floor area", "About 17 sq m"], ["Ceiling height", "3.0 m"], ["Window", "2.4 m wide, south west"], ["Shelving", "About 600 books"], ["Desk", "1.8 m, oak"], ["Seats", "1 to 2 people"], ["Orientation", "South west, to the mountain"]],
      idea: "This room carries the second idea of the finale: rooms that hold still. The plan moves in a slow line, arrive, gather, retreat, and the study is the retreat at the end of that line. Nothing crosses it and nothing hurries through it. The lake still closes the view, water as a wall, so the quiet stays private without a fence or a curtain."
    }
  };
  var sheet = document.getElementById('roomSheet');
  var scrim = document.getElementById('sheetScrim');
  var sheetCloseBtn = document.getElementById('sheetClose');
  var lastFocus = null;
  window.__ardmereSheetOpen = false;
  function openRoomSheet(key){
    var room = ROOMS[key];
    if (!room || !sheet) return;
    lastFocus = document.activeElement;
    document.getElementById('sheetImg').src = room.img;
    document.getElementById('sheetImg').alt = room.alt;
    document.getElementById('sheetKicker').textContent = room.kicker;
    document.getElementById('sheetTitle').textContent = room.title;
    document.getElementById('sheetCode').textContent = room.code;
    document.getElementById('sheetLine').textContent = room.line;
    document.getElementById('sheetWhat').textContent = room.what;
    var list = document.getElementById('sheetFeatures');
    list.innerHTML = '';
    room.features.forEach(function(txt){
      var li = document.createElement('li'); li.textContent = txt; list.appendChild(li);
    });
    var dataEl = document.getElementById('sheetData');
    dataEl.innerHTML = '';
    room.data.forEach(function(pair){
      var div = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = pair[0];
      var dd = document.createElement('dd'); dd.textContent = pair[1];
      div.appendChild(dt); div.appendChild(dd); dataEl.appendChild(div);
    });
    document.getElementById('sheetIdea').textContent = room.idea;
    sheet.hidden = false;
    if (scrim) scrim.hidden = false;
    sheet.querySelector('.sheet-scroll').scrollTop = 0;
    window.__ardmereSheetOpen = true;
    var opened = false;
    function markOpen(){
      if (opened) return;
      opened = true;
      sheet.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('show');
    }
    requestAnimationFrame(function(){ requestAnimationFrame(markOpen); });
    setTimeout(markOpen, 70);
    if (sheetCloseBtn) sheetCloseBtn.focus({ preventScroll: true });
  }
  function closeRoomSheet(){
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('show');
    window.__ardmereSheetOpen = false;
    setTimeout(function(){
      sheet.hidden = true;
      if (scrim) scrim.hidden = true;
    }, reduced ? 0 : 460);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  window.__ardmereCloseSheet = closeRoomSheet;
  document.querySelectorAll('[data-room]').forEach(function(btn){
    btn.addEventListener('click', function(ev){
      ev.stopPropagation();
      openRoomSheet(btn.getAttribute('data-room'));
    });
  });
  if (sheetCloseBtn) sheetCloseBtn.addEventListener('click', closeRoomSheet);
  if (scrim) scrim.addEventListener('click', closeRoomSheet);

})();
