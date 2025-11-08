let allSongs = [];
let setlists = [];
let favorites = new Set();
let allGenres = [];

document.addEventListener("DOMContentLoaded", async () => {
  // JSONロード
  [allSongs, setlists] = await Promise.all([
    fetch("songs_aya_uchida_charactor.json").then(r => r.json()),
    fetch("setlists.json").then(r => r.json())
  ]);

  // セットリストセレクト生成
  const setSel = document.getElementById("setlistSelect");
  setlists.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    setSel.appendChild(opt);
  });

  // ジャンル一覧を抽出
  allGenres = [...new Set(allSongs.flatMap(s => s.genres))].sort();

  // ジャンルセレクト生成（複数選択）
  const genreSel = document.getElementById("genreSelect");
  allGenres.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreSel.appendChild(opt);
  });

  // 初期状態（URL or LocalStorage）
  loadFavoritesFromURL();
  if (favorites.size === 0) loadFavoritesFromLocalStorage();

  renderSongs();

  // イベント登録
  document.getElementById("filterInput").addEventListener("input", renderSongs);
  document.getElementById("setlistSelect").addEventListener("change", renderSongs);
  document.getElementById("showFavorites").addEventListener("change", renderSongs);
  document.getElementById("sortOrder").addEventListener("change", renderSongs);
  document.getElementById("genreSelect").addEventListener("change", renderSongs);
  document.getElementById("shareFavorites").addEventListener("click", shareFavorites);
  document.getElementById("copyLink").addEventListener("click", copyLinkToClipboard);
});

// ---------------------
// 表示処理
// ---------------------
function renderSongs() {
  const filterText = document.getElementById("filterInput").value.toLowerCase();
  const setlistValue = document.getElementById("setlistSelect").value;
  const showFav = document.getElementById("showFavorites").checked;
  const sortOrder = document.getElementById("sortOrder").value;
  const selectedGenres = Array.from(document.getElementById("genreSelect").selectedOptions).map(o => o.value);

  let songs = [...allSongs];

  // セットリストフィルタ
  if (setlistValue) {
    const ids = setlists.find(s => s.id === setlistValue)?.songs || [];
    songs = songs.filter(s => ids.includes(s.id));
  }

  // 検索
  if (filterText) {
    songs = songs.filter(s => s.title.toLowerCase().includes(filterText));
  }

  // ジャンルフィルタ（1つでも一致で表示）
  if (selectedGenres.length > 0) {
    songs = songs.filter(s => s.genres.some(g => selectedGenres.includes(g)));
  }

  // お気に入りフィルタ
  if (showFav) {
    songs = songs.filter(s => favorites.has(s.id));
  }

  // ソート
  songs.sort((a, b) => {
    const da = new Date(a.release);
    const db = new Date(b.release);
    return sortOrder === "asc" ? da - db : db - da;
  });

  // 表示更新
  const listEl = document.getElementById("songList");
  listEl.innerHTML = "";

  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "song";
    // div.innerHTML = `
    //   <strong>${song.title}</strong> - ${song.artist} (${song.release})<br>
    //   <small>${song.genres.join(", ")}</small>
    //   <button data-id="${song.id}" class="favBtn">
    //     ${favorites.has(song.id) ? "★" : "☆"}
    //   </button>
    // `;
    div.innerHTML = `
      <strong>${song.title}</strong> - (${song.info})  (${song.release})<br>
      <small>${song.genres.join(", ")}</small>
      <button data-id="${song.id}" class="favBtn">
        ${favorites.has(song.id) ? "★" : "☆"}
      </button>
    `;
    listEl.appendChild(div);
  });

  document.querySelectorAll(".favBtn").forEach(btn =>
    btn.addEventListener("click", toggleFavorite)
  );
}

// ---------------------
// お気に入り処理
// ---------------------
function toggleFavorite(e) {
  const id = e.target.dataset.id;
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  console.log("toggleFavorite");
  saveFavoritesToLocalStorage();
  renderSongs();
}

function saveFavoritesToLocalStorage() {
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
}

function loadFavoritesFromLocalStorage() {
  const favData = localStorage.getItem("favorites");
  if (favData) favorites = new Set(JSON.parse(favData));
}

function loadFavoritesFromURL() {
  const params = new URLSearchParams(location.search);
  const favParam = params.get("favorites");
  if (favParam) {
    favorites = new Set(favParam.split(",").map(x => x));
    document.getElementById("showFavorites").checked = true;
  }
}

// ---------------------
// お気に入りリンク生成・コピー
// ---------------------
function shareFavorites() {
  const favArray = [...favorites];
  const url = `${location.origin}${location.pathname}?favorites=${favArray.join(",")}`;
  const linkEl = document.getElementById("linkOutput");
  linkEl.textContent = url;
  linkEl.style.wordBreak = "break-all";
  document.getElementById("copyLink").style.display = "inline";
}

function copyLinkToClipboard() {
  const text = document.getElementById("linkOutput").textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("リンクをコピーしました！");
  });
}
