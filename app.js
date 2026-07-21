(() => {
  "use strict";

  const records = Array.isArray(window.ILCO_RECORDS) ? window.ILCO_RECORDS : [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const formatWon = (value) => new Intl.NumberFormat("ko-KR").format(value) + "원";
  const unique = (key) => [...new Set(records.map(r => r[key]).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, "ko"));
  const getRecord = (id) => records.find(r => r.record_id === id);

  const DEFAULT_COLUMNS = ["record_id", "대분류", "수치_성격", "데이터_차원", "지표", "대상_사례", "표시값", "교차문서_상태", "출처수", "검증_주의"];
  const COLUMN_LABELS = {
    record_id: "ID", 대분류: "대분류", 수치_성격: "수치 성격", 데이터_차원: "데이터 차원",
    지표: "지표", 대상_사례: "대상·사례", 표시값: "표시값", 교차문서_상태: "교차문서 상태",
    출처수: "출처 수", 검증_주의: "검증 주의", 대표값: "대표값", 단위: "단위",
    기준_시작: "기준 시작", 기준_종료: "기준 종료", 한눈에_보는_해석: "해석"
  };
  const ALL_COLUMNS = [...DEFAULT_COLUMNS, "대표값", "단위", "기준_시작", "기준_종료", "한눈에_보는_해석"];

  const state = {
    view: location.hash.replace("#", "") || "overview",
    globalSearch: "",
    tableSearch: "",
    filters: {
      대분류: "", 데이터_차원: "", 대상_사례: "", 수치_성격: "", 교차문서_상태: "", 출처_문서: ""
    },
    page: 1,
    pageSize: 10,
    sortKey: "record_id",
    sortDirection: "asc",
    visibleColumns: [...DEFAULT_COLUMNS]
  };

  const metricData = [
    { id: "Q002", no: "AUDIENCE", value: "20–30대", label: "핵심 구매층 · 직장인", icon: "☺" },
    { id: "Q011", no: "MARKET", value: "1조 원+", label: "2025 MD·굿즈 매출 전망", icon: "₩" },
    { id: null, no: "DATABASE", value: "93건", label: "검수된 데이터 레코드", icon: "▦" },
    { id: "Q043", no: "PILOT", value: "12주", label: "권고 파일럿 기간", icon: "↗" },
    { id: "Q039", no: "JOURNEY", value: "6단계", label: "SNS 구매 여정", icon: "∞" },
    { id: "Q040", no: "PORTFOLIO", value: "4층위", label: "상품 포트폴리오", icon: "◇" }
  ];

  const insights = [
    ["◒", "선택적 정체성 표현", "상황에 따라 팬덤 정체성의 공개 범위를 조절"],
    ["⌁", "코드화된 연대감", "팬만 알아보는 색·문구·오브제로 연결"],
    ["✓", "실용적 자기합리화", "매일 쓸 수 있는 기능이 구매 이유를 강화"],
    ["≈", "감각적 위안", "촉감·소리·질감이 애착과 만족을 형성"],
    ["★", "희소성·수집성", "투명한 한정 경험과 소장 가치"]
  ];

  const journey = [
    ["01", "발견", "숏폼·피드", "도달·완주율"],
    ["02", "해독", "코드·세계관", "저장·댓글"],
    ["03", "정당화", "후기·소재", "상세조회·체류"],
    ["04", "구매", "한정·구성", "전환율·판매율"],
    ["05", "사용", "TPO 배치", "사용형 UGC"],
    ["06", "확산", "언박싱·리믹스", "공유·재생산"]
  ];

  const cases = [
    {
      code: "BT", title: "BT21", summary: "독립 캐릭터 IP 확장",
      execution: "아티스트 초상을 직접 노출하기보다 독립 캐릭터 IP로 확장했습니다.",
      insight: "팬덤 밖에서도 통하는 캐릭터 디자인 완성도가 장기적인 확장성을 만듭니다.",
      recordIds: ["Q009"]
    },
    {
      code: "BA", title: "블루 아카이브 × 무신사", summary: "세계관을 스트릿웨어로",
      execution: "게임 속 세력 상징을 미니멀한 스트릿웨어의 색·그래픽 문법으로 번역했습니다.",
      insight: "팬 코드는 유지하면서 비팬도 입을 수 있는 완결된 패션 디자인이 필요합니다.",
      recordIds: ["Q014", "Q015"]
    },
    {
      code: "NC", title: "스타벅스 × NCT", summary: "9종 · 10분 품절",
      execution: "손글씨와 포토카드 홀더를 일상의 음료 소비 루틴에 결합했습니다.",
      insight: "기존 소비 습관과 팬덤의 소장 욕구가 만날 때 초기 집중 수요가 커집니다.",
      recordIds: ["Q023", "Q024"]
    },
    {
      code: "IS", title: "이세계아이돌 팝업", summary: "실사용 MD 5개 가격군",
      execution: "수면안대·마우스패드·텀블러 등 직장과 가정에서 사용할 수 있는 상품을 전개했습니다.",
      insight: "가상 IP도 구체적인 TPO를 확보하면 생활 접점으로 확장할 수 있습니다.",
      recordIds: ["Q073", "Q074", "Q075", "Q076", "Q077", "Q091"]
    },
    {
      code: "HY", title: "HYBE 글로벌 팝업", summary: "19개국 · 39개 도시",
      execution: "2019년부터 71개 팝업을 운영하며 글로벌 오프라인 접점을 누적했습니다.",
      insight: "일회성 품절보다 방문 경험이 후속 구매와 콘텐츠로 연결되는지 확인해야 합니다.",
      recordIds: ["Q025", "Q026", "Q027", "Q028", "Q029", "Q030", "Q031", "Q032", "Q033"]
    },
    {
      code: "MP", title: "마플 온디맨드", summary: "약 2,000종 · 1개부터",
      execution: "소량 주문 제작으로 초기 디자인을 빠르게 검증하고 재고 부담을 낮춥니다.",
      insight: "2~3개 디자인을 먼저 시험한 뒤 저장률·구매의향·실사용 평가로 증산합니다.",
      recordIds: ["Q020", "Q021", "Q022", "Q092"]
    }
  ];

  const caseSummary = [
    ["POP-UP NETWORK", "19개국", "HYBE 글로벌 운영", "Q026"],
    ["OFFLINE TRAFFIC", "174만 명", "누적 팝업 방문객", "Q029"],
    ["RETAIL SALES", "300만 개+", "블루 아카이브×GS25", "Q019"],
    ["ON-DEMAND", "1개부터", "마플 최소 제작 수량", "Q021"]
  ];

  const priceGroups = [
    { title: "무신사 협업 확정가", n: 4, avg: 32033, median: 35015, min: 8800, max: 49300, id: "Q090" },
    { title: "이세계아이돌 팝업", n: 5, avg: 20000, median: 15000, min: 8000, max: 35000, id: "Q091" },
    { title: "마플 최소 제작 단가", n: 4, avg: 7600, median: 8500, min: 4400, max: 9000, id: "Q092" },
    { title: "C2C 거래 호가", n: 6, avg: 55143, median: 25000, min: 12345, max: 190000, id: "Q093" }
  ];

  const pilotStages = [
    { title: "진단", sub: "1~2주", start: 1, span: 2, task: "팬 인터뷰 · 코드맵 · TPO" },
    { title: "시제품", sub: "3~5주", start: 3, span: 3, task: "입문·핵심·화제형 각 2종" },
    { title: "콘텐츠", sub: "6주", start: 6, span: 1, task: "숏폼 6종 · UGC 가이드" },
    { title: "검증", sub: "7~8주", start: 7, span: 2, task: "소량 판매 · 후기 분석" },
    { title: "확장", sub: "9~12주", start: 9, span: 4, task: "본 판매 · 협업 · 팝업" }
  ];

  const kpis = [
    ["◎", "발견", "도달 · 완주율 · 저장률", "주간"],
    ["♯", "해독·참여", "코드 댓글 · 투표 · 리믹스", "주간"],
    ["↗", "전환", "상세조회 · 구매전환 · 판매율", "일·주간"],
    ["▣", "실사용", "착용·사용 장면 UGC 비중", "주간"],
    ["♥", "상품성", "재구매 · 반품 · 불량 · 빈도", "월간"],
    ["✦", "확장성", "비팬 구매 · 협업 · UGC 재생산", "캠페인별"],
    ["₩", "재무", "기여이익 · 재고회전 · 증산 정확도", "월간"]
  ];

  function initStaticContent() {
    $("#metricGrid").innerHTML = metricData.map((m, i) => `
      <button class="metric-card" ${m.id ? `data-record="${m.id}"` : 'data-go-view="explorer"'}>
        <span class="metric-no">${String(i + 1).padStart(2, "0")} · ${m.no}</span>
        <strong>${m.value}</strong><p>${m.label}</p><i aria-hidden="true">${m.icon}</i>
      </button>`).join("");

    $("#insightGrid").innerHTML = insights.map(x => `
      <article class="insight-card"><span aria-hidden="true">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("");

    $("#journeyFlow").innerHTML = journey.map(x => `
      <article class="journey-step"><div class="journey-number">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p><small>${x[3]}</small></article>`).join("");

    $("#caseSummary").innerHTML = caseSummary.map(x => `
      <button class="summary-card" data-record="${x[3]}"><span>${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></button>`).join("");

    $("#caseList").innerHTML = cases.map((c, i) => `
      <button class="case-list-button" data-case="${i}">
        <span>${c.code}</span><span><strong>${c.title}</strong><br><small>${c.summary}</small></span><i>→</i>
      </button>`).join("");

    const popup = [["19", "국가"], ["39", "도시"], ["71", "팝업"]];
    $("#popupChart").innerHTML = popup.map((x) => `
      <div class="bar-item"><div class="bar" style="height:${Math.max(45, Number(x[0]) / 71 * 185)}px">${x[0]}</div><span class="bar-label">${x[1]}</span></div>`).join("");

    const maxPrice = 200000;
    $("#priceChart").innerHTML = priceGroups.map((p) => {
      const left = p.min / maxPrice * 100;
      const width = (p.max - p.min) / maxPrice * 100;
      const avg = p.avg / maxPrice * 100;
      const med = p.median / maxPrice * 100;
      return `<div class="range-row">
        <button class="range-label text-link" data-record="${p.id}"><strong>${p.title}</strong><small>n=${p.n}</small></button>
        <div class="range-track">
          <span class="range-segment" style="left:${left}%;width:${Math.max(width, .8)}%"></span>
          <button class="range-point average" style="left:${avg}%" aria-label="${p.title} 평균 ${formatWon(p.avg)}"><span class="range-tooltip">평균 ${formatWon(p.avg)}</span></button>
          <button class="range-point median" style="left:${med}%" aria-label="${p.title} 중앙값 ${formatWon(p.median)}"><span class="range-tooltip">중앙 ${formatWon(p.median)}</span></button>
        </div>
      </div>`;
    }).join("");

    $("#priceCards").innerHTML = priceGroups.map(p => `
      <article class="price-card"><span class="sample">n=${p.n}</span><h3>${p.title}</h3>
        <strong>${formatWon(p.avg)}</strong><p>평균 · 중앙 ${formatWon(p.median)}</p><p>범위 ${formatWon(p.min)}–${formatWon(p.max)}</p>
      </article>`).join("");

    const priceRows = records.filter(r => ["Q069", "Q073", "Q078", "Q082", "Q088"].includes(r.record_id));
    $("#priceTable").innerHTML = `<thead><tr><th>구분</th><th>대상·사례</th><th>표시값</th><th>검증 주의</th></tr></thead><tbody>${
      priceRows.map(r => `<tr tabindex="0" data-record="${r.record_id}"><td>${escapeHtml(r.수치_성격)}</td><td>${escapeHtml(r.대상_사례)}</td><td><b>${escapeHtml(r.표시값)}</b></td><td>${escapeHtml(r.검증_주의)}</td></tr>`).join("")
    }</tbody>`;

    $("#weeksRow").innerHTML = Array.from({ length: 12 }, (_, i) => `<span class="week ${[2,5,8,12].includes(i+1) ? "is-gate" : ""}">${i + 1}</span>`).join("");
    $("#pilotTrack").innerHTML = pilotStages.map(p => `
      <div class="pilot-row"><div class="pilot-label"><strong>${p.title}</strong><small>${p.sub}</small></div>
      <div class="pilot-grid"><div class="pilot-bar" style="grid-column:${p.start} / span ${p.span}">${p.task}</div></div></div>`).join("");

    const savedGates = JSON.parse(localStorage.getItem("ilcoGateStatus") || "{}");
    $("#gateStatus").innerHTML = [2,5,8,12].map(g => `
      <label class="gate-card"><strong>G${g} · ${g}주</strong>
        <select data-gate="${g}" aria-label="${g}주 의사결정 상태">
          ${["미정", "계속", "수정", "중단"].map(v => `<option ${savedGates[g] === v ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </label>`).join("");

    $("#kpiGrid").innerHTML = kpis.map(k => `
      <article class="kpi-card"><span class="kpi-icon" aria-hidden="true">${k[0]}</span><h3>${k[1]}</h3><p>${k[2]}</p><small>${k[3]} CHECK</small></article>`).join("");
  }

  function sourceMatches(record, source) {
    if (!source) return true;
    if (source === "시장조사 보고서") return Number(record.시장조사_포함) === 1;
    if (source === "결과 보고서") return Number(record.Docs_포함) === 1;
    if (source === "발표자료") return Number(record.Slides_포함) === 1;
    return true;
  }

  function searchBlob(record) {
    return Object.values(record).filter(v => v !== null).join(" ").toLowerCase();
  }

  function getFilteredRecords() {
    const global = state.globalSearch.trim().toLowerCase();
    const local = state.tableSearch.trim().toLowerCase();
    let result = records.filter(r => {
      const blob = searchBlob(r);
      if (global && !blob.includes(global)) return false;
      if (local && !blob.includes(local)) return false;
      if (state.filters.대분류 && r.대분류 !== state.filters.대분류) return false;
      if (state.filters.데이터_차원 && r.데이터_차원 !== state.filters.데이터_차원) return false;
      if (state.filters.대상_사례 && r.대상_사례 !== state.filters.대상_사례) return false;
      if (state.filters.수치_성격 && r.수치_성격 !== state.filters.수치_성격) return false;
      if (state.filters.교차문서_상태 && r.교차문서_상태 !== state.filters.교차문서_상태) return false;
      if (!sourceMatches(r, state.filters.출처_문서)) return false;
      return true;
    });
    result.sort((a, b) => {
      const av = a[state.sortKey] ?? "";
      const bv = b[state.sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "ko", { numeric: true });
      return state.sortDirection === "asc" ? cmp : -cmp;
    });
    return result;
  }

  function statusClass(record) {
    const status = String(record.교차문서_상태 || "");
    const caution = String(record.검증_주의 || "");
    if (/불명확|원출처|주의|일반화|합산|호가/.test(caution) && /단일|게시/.test(status)) return "caution";
    if (/단일|시장조사|게시/.test(status)) return "single";
    return "verified";
  }

  function renderTable() {
    const filtered = getFilteredRecords();
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const pageRows = filtered.slice(start, start + state.pageSize);

    $("#recordCount").textContent = filtered.length;
    $("#dataTableHead").innerHTML = `<tr>${state.visibleColumns.map(key => `
      <th scope="col"><button data-sort="${key}">${escapeHtml(COLUMN_LABELS[key] || key)} ${state.sortKey === key ? (state.sortDirection === "asc" ? "↑" : "↓") : "↕"}</button></th>`).join("")}</tr>`;

    $("#dataTableBody").innerHTML = pageRows.map(r => `
      <tr tabindex="0" data-record="${r.record_id}" aria-label="${escapeHtml(r.record_id)} ${escapeHtml(r.지표)} 상세 보기">
        ${state.visibleColumns.map(key => {
          let val = r[key] ?? "—";
          if (key === "교차문서_상태") return `<td><span class="table-status ${statusClass(r)}">${escapeHtml(val)}</span></td>`;
          if (key === "출처수") val = val ? `${val}개` : "—";
          return `<td>${escapeHtml(val)}</td>`;
        }).join("")}
      </tr>`).join("");

    $("#emptyState").hidden = filtered.length > 0;
    $("#dataTable").hidden = filtered.length === 0;
    $("#prevPage").disabled = state.page <= 1;
    $("#nextPage").disabled = state.page >= totalPages;

    const pages = [];
    const from = Math.max(1, state.page - 2);
    const to = Math.min(totalPages, state.page + 2);
    for (let p = from; p <= to; p++) pages.push(p);
    $("#pageNumbers").innerHTML = pages.map(p => `<button class="${p === state.page ? "is-current" : ""}" data-page="${p}" aria-label="${p}페이지" ${p === state.page ? 'aria-current="page"' : ""}>${p}</button>`).join("");
    renderFilterChips();
  }

  function renderFilterChips() {
    const entries = Object.entries(state.filters).filter(([, value]) => value);
    const globalEntry = state.globalSearch ? [["검색", state.globalSearch]] : [];
    const all = [...globalEntry, ...entries];
    $("#filterCount").textContent = all.length;
    $("#activeFilters").innerHTML = all.map(([key, value]) => `
      <span class="filter-chip">${escapeHtml(key)}: ${escapeHtml(value)}
        <button data-remove-filter="${escapeHtml(key)}" aria-label="${escapeHtml(key)} 필터 제거">×</button>
      </span>`).join("");
  }

  function populateFilters() {
    const config = [
      ["대분류", "대분류", unique("대분류")],
      ["데이터_차원", "데이터 차원", unique("데이터_차원")],
      ["대상_사례", "대상·사례", unique("대상_사례")],
      ["수치_성격", "수치 성격", unique("수치_성격")],
      ["교차문서_상태", "교차문서 상태", unique("교차문서_상태")],
      ["출처_문서", "출처 문서", ["시장조사 보고서", "결과 보고서", "발표자료"]]
    ];
    $("#filterFields").innerHTML = config.map(([key, label, options]) => `
      <div class="filter-field"><label for="dialog-${key}">${label}</label>
        <select id="dialog-${key}" data-dialog-filter="${key}">
          <option value="">전체</option>${options.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("")}
        </select></div>`).join("");

    $("#categoryFilter").innerHTML += unique("대분류").map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
    $("#statusFilter").innerHTML += unique("교차문서_상태").map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");

    $("#columnOptions").innerHTML = ALL_COLUMNS.map(key => `
      <label class="column-option"><input type="checkbox" value="${key}" ${state.visibleColumns.includes(key) ? "checked" : ""}>
      <span>${escapeHtml(COLUMN_LABELS[key] || key)}</span></label>`).join("");
  }

  function setView(view, { focus = true } = {}) {
    const valid = ["overview", "market", "price", "pilot", "explorer"];
    if (!valid.includes(view)) view = "overview";
    state.view = view;
    $$(".view").forEach(panel => {
      const active = panel.dataset.viewPanel === view;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    $$(".nav-item").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    history.replaceState(null, "", "#" + view);
    closeMobileMenu();
    if (focus) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => $("#main-content").focus({ preventScroll: true }), 180);
    }
    if (view === "explorer") renderTable();
  }

  function openRecord(id) {
    const r = getRecord(id);
    if (!r) return;
    $("#drawerLabel").textContent = `${r.대분류 || "DATA"} · ${r.수치_성격 || "RECORD"}`;
    $("#drawerTitle").textContent = r.지표 || "데이터 상세";
    const links = String(r.출처_위치 || "").match(/https?:\/\/[^\s|]+/g) || [];
    const keyItems = [
      ["대상·사례", r.대상_사례], ["데이터 차원", r.데이터_차원],
      ["최소값", r.최소값], ["최대값", r.최대값], ["대표값", r.대표값],
      ["단위", r.단위], ["연산자", r.연산자],
      ["기준 기간", [r.기준_시작, r.기준_종료].filter(Boolean).join(" ~ ")],
      ["교차문서 상태", r.교차문서_상태], ["출처 수", r.출처수 ? r.출처수 + "개" : null],
      ["산출식·정규화", r.산출식_정규화], ["한눈에 보는 해석", r.한눈에_보는_해석],
      ["근거 요약", r.근거_요약], ["검증 주의", r.검증_주의],
      ["검수 조치", r.검수_조치]
    ].filter(([, value]) => value !== null && value !== "" && value !== undefined);

    $("#drawerContent").innerHTML = `
      <div class="detail-hero"><span class="detail-id">${escapeHtml(r.record_id)}</span>
        <h3>${escapeHtml(r.지표)}</h3><div class="detail-value">${escapeHtml(r.표시값 ?? "값 없음")}</div>
      </div>
      <dl class="detail-grid">${keyItems.map(([label, value]) => `
        <div class="detail-item ${String(value).length > 80 ? "is-wide" : ""}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        <div class="detail-item is-wide"><dt>문서 포함</dt><dd>시장조사 ${Number(r.시장조사_포함) ? "✓" : "–"} · 결과 보고서 ${Number(r.Docs_포함) ? "✓" : "–"} · 발표자료 ${Number(r.Slides_포함) ? "✓" : "–"}</dd></div>
        ${links.length ? `<div class="detail-item is-wide"><dt>출처 링크</dt><dd class="source-links">${links.map((link, i) => `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">출처 ${i + 1} 새 탭에서 열기 ↗</a>`).join("")}</dd></div>` : ""}
      </dl>`;
    openDrawer();
  }

  function openCase(index) {
    const c = cases[index];
    if (!c) return;
    $("#drawerLabel").textContent = "CASE STUDY · " + c.code;
    $("#drawerTitle").textContent = c.title;
    const related = c.recordIds.map(getRecord).filter(Boolean);
    $("#drawerContent").innerHTML = `
      <div class="detail-hero"><span class="detail-id">CASE INSIGHT</span><h3>${escapeHtml(c.title)}</h3><div class="detail-value">${escapeHtml(c.summary)}</div></div>
      <dl class="detail-grid">
        <div class="detail-item is-wide"><dt>실행 방식</dt><dd>${escapeHtml(c.execution)}</dd></div>
        <div class="detail-item is-wide"><dt>시사점</dt><dd>${escapeHtml(c.insight)}</dd></div>
      </dl>
      <div class="panel-heading" style="margin-top:22px"><div><p class="mini-label">RELATED DATA</p><h2>연결된 근거</h2></div></div>
      <div class="case-list">${related.map(r => `<button class="case-list-button" data-record="${r.record_id}"><span>${escapeHtml(r.record_id.replace("Q", ""))}</span><span><strong>${escapeHtml(r.지표)}</strong><br><small>${escapeHtml(r.표시값)}</small></span><i>→</i></button>`).join("")}</div>`;
    openDrawer();
  }

  function openDrawer() {
    $("#overlay").hidden = false;
    $("#detailDrawer").classList.add("is-open");
    $("#detailDrawer").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("[data-close-drawer]").focus(), 80);
  }

  function closeDrawer() {
    $("#detailDrawer").classList.remove("is-open");
    $("#detailDrawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
    document.body.style.overflow = "";
  }

  function openMobileMenu() {
    $(".sidebar").classList.add("is-open");
    $("#mobileMenu").setAttribute("aria-expanded", "true");
    $("#overlay").hidden = false;
  }

  function closeMobileMenu() {
    $(".sidebar").classList.remove("is-open");
    $("#mobileMenu").setAttribute("aria-expanded", "false");
    if (!$("#detailDrawer").classList.contains("is-open")) $("#overlay").hidden = true;
  }

  function applyDialogFilters() {
    $$("[data-dialog-filter]").forEach(select => state.filters[select.dataset.dialogFilter] = select.value);
    state.page = 1;
    $("#categoryFilter").value = state.filters.대분류;
    $("#statusFilter").value = state.filters.교차문서_상태;
    renderTable();
  }

  function resetFilters() {
    Object.keys(state.filters).forEach(key => state.filters[key] = "");
    state.globalSearch = "";
    state.tableSearch = "";
    $("#globalSearch").value = "";
    $("#tableSearch").value = "";
    $("#categoryFilter").value = "";
    $("#statusFilter").value = "";
    $$("[data-dialog-filter]").forEach(select => select.value = "");
    state.page = 1;
    renderTable();
  }

  function downloadCsv() {
    const rows = getFilteredRecords();
    if (!rows.length) return showToast("다운로드할 데이터가 없습니다.");
    const headers = Object.keys(records[0] || {});
    const csvCell = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
    const csv = "\uFEFF" + [headers.map(csvCell).join(","), ...rows.map(r => headers.map(h => csvCell(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ilco_goods_data_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length}개 레코드를 CSV로 저장했습니다.`);
  }

  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-view]");
      if (nav) return setView(nav.dataset.view);
      const go = event.target.closest("[data-go-view]");
      if (go) return setView(go.dataset.goView);
      const record = event.target.closest("[data-record]");
      if (record) return openRecord(record.dataset.record);
      const caseButton = event.target.closest("[data-case]");
      if (caseButton) return openCase(Number(caseButton.dataset.case));
      const page = event.target.closest("[data-page]");
      if (page) { state.page = Number(page.dataset.page); renderTable(); return; }
      const sort = event.target.closest("[data-sort]");
      if (sort) {
        const key = sort.dataset.sort;
        state.sortDirection = state.sortKey === key && state.sortDirection === "asc" ? "desc" : "asc";
        state.sortKey = key; renderTable(); return;
      }
      const remove = event.target.closest("[data-remove-filter]");
      if (remove) {
        const key = remove.dataset.removeFilter;
        if (key === "검색") { state.globalSearch = ""; $("#globalSearch").value = ""; }
        else state.filters[key] = "";
        state.page = 1; renderTable(); return;
      }
      if (event.target.closest("[data-close-drawer]")) closeDrawer();
      if (event.target.closest("[data-price-explorer]")) {
        state.filters.대분류 = "가격 데이터";
        $("#categoryFilter").value = "가격 데이터";
        state.page = 1; setView("explorer"); return;
      }
    });

    $("#globalSearch").addEventListener("input", (e) => {
      state.globalSearch = e.target.value;
      state.page = 1;
      renderTable();
    });
    $("#globalSearch").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && state.globalSearch.trim()) setView("explorer");
    });
    $("#tableSearch").addEventListener("input", (e) => { state.tableSearch = e.target.value; state.page = 1; renderTable(); });
    $("#categoryFilter").addEventListener("change", (e) => { state.filters.대분류 = e.target.value; state.page = 1; renderTable(); });
    $("#statusFilter").addEventListener("change", (e) => { state.filters.교차문서_상태 = e.target.value; state.page = 1; renderTable(); });
    $("#prevPage").addEventListener("click", () => { if (state.page > 1) { state.page--; renderTable(); } });
    $("#nextPage").addEventListener("click", () => { state.page++; renderTable(); });
    $("#downloadCsv").addEventListener("click", downloadCsv);
    $("#clearAll").addEventListener("click", resetFilters);

    $("#openFilters").addEventListener("click", () => {
      $$("[data-dialog-filter]").forEach(select => select.value = state.filters[select.dataset.dialogFilter] || "");
      $("#filterDialog").showModal();
    });
    $("#applyDialogFilters").addEventListener("click", applyDialogFilters);
    $("#resetDialogFilters").addEventListener("click", () => $$("[data-dialog-filter]").forEach(select => select.value = ""));

    $("#columnToggle").addEventListener("click", () => {
      $$("#columnOptions input").forEach(input => input.checked = state.visibleColumns.includes(input.value));
      $("#columnDialog").showModal();
    });
    $("#columnDialog").addEventListener("close", () => {
      if ($("#columnDialog").returnValue !== "apply") return;
      const selected = $$("#columnOptions input:checked").map(input => input.value);
      state.visibleColumns = selected.length ? selected : [...DEFAULT_COLUMNS];
      renderTable();
    });
    $("#resetColumns").addEventListener("click", () => $$("#columnOptions input").forEach(input => input.checked = DEFAULT_COLUMNS.includes(input.value)));

    $("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.contains("is-open") ? closeMobileMenu() : openMobileMenu());
    $("#overlay").addEventListener("click", () => { closeDrawer(); closeMobileMenu(); });
    $("#gateStatus").addEventListener("change", (e) => {
      const select = e.target.closest("[data-gate]");
      if (!select) return;
      const saved = JSON.parse(localStorage.getItem("ilcoGateStatus") || "{}");
      saved[select.dataset.gate] = select.value;
      localStorage.setItem("ilcoGateStatus", JSON.stringify(saved));
      showToast(`G${select.dataset.gate} 상태를 '${select.value}'로 저장했습니다.`);
    });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); $("#globalSearch").focus();
      }
      if (e.key === "Escape") { closeDrawer(); closeMobileMenu(); }
    });

    $("#dataTableBody").addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest("tr")) {
        e.preventDefault(); openRecord(e.target.closest("tr").dataset.record);
      }
    });
    $("#priceTable").addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest("tr[data-record]")) {
        e.preventDefault(); openRecord(e.target.closest("tr").dataset.record);
      }
    });
  }

  function init() {
    initStaticContent();
    populateFilters();
    bindEvents();
    renderTable();
    setView(state.view, { focus: false });
    if (!records.length) showToast("데이터를 불러오지 못했습니다.");
  }

  init();
})();

