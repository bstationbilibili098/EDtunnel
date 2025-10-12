import { connect } from "cloudflare:sockets";

const rootDomain = "ndygaming.web.id"; // Ganti dengan domain utama kalian
const serviceName = "vip"; // Ganti dengan nama workers kalian
const apiKey = "I8pAX7HJtHIyoWZpNlVi8qfmwH4CWrUM9dbHlGQe"; // Ganti dengan Global API key kalian (https://dash.cloudflare.com/profile/api-tokens)
const apiEmail = "bstationbilibili098@gmail.com"; // Ganti dengan email yang kalian gunakan
const accountID = "27a81d3c2505f808f7c5fd16f49d3001"; // Ganti dengan Account ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
const zoneID = "d380c84d96157b014227df1730b219c1"; // Ganti dengan Zone ID kalian (https://dash.cloudflare.com -> Klik domain yang kalian gunakan)
let isApiReady = false;
let prxIP = "";
let cachedPrxList = [];

const horse = "dHJvamFu";
const flash = "dmxlc3M=";
const v2 = "djJyYXk=";
const neko = "Y2xhc2g=";

const APP_DOMAIN = `${serviceName}.${rootDomain}`;
const PORTS = [443, 80];
const PROTOCOLS = [atob(horse), atob(flash), "ss"];
const KV_PRX_URL = "https://raw.githubusercontent.com/jaka2m/Nautica/refs/heads/main/kvProxyList.json";
const PRX_BANK_URL = "https://raw.githubusercontent.com/jaka2m/botak/refs/heads/main/cek/proxyList.txt";
const NAMAWEB = 'GEO PROJECT'
const LINK_TELEGRAM = 'https://t.me/sampiiiiu'
const DONATE_LINK = "https://github.com/jaka1m/project/raw/main/BAYAR.jpg";
const TELEGRAM_USERNAME = "sampiiiiu";
const WHATSAPP_NUMBER = "6282339191527";
const DNS_SERVER_ADDRESS = "8.8.8.8";
const DNS_SERVER_PORT = 53;
const CONVERTER_URL = "https://api.foolvpn.me/convert";
const BAD_WORDS_LIST = "https://gist.githubusercontent.com/adierebel/a69396d79b787b84d89b45002cb37cd6/raw/6df5f8728b18699496ad588b395391078ab9cf1/kata-kasar.txt";
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
const PROXY_PER_PAGE = 20;
const CORS_HEADER_OPTIONS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
};

// ====================================================================
// Helper Functions
// ====================================================================
function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function buildCountryFlag(proxyList) {
    const flagList = proxyList.map((prx) => prx.country);
    const uniqueFlags = new Set(flagList);
    let flagElement = "";
    for (const flag of uniqueFlags) {
        if (flag && flag !== "Unknown") {
            try {
                flagElement += `<a href="/sub?search=${flag.toLowerCase()}&page=0" class="py-1">
                    <span class="flag-icon flag-icon-${flag.toLowerCase()} h-10 w-10 mx-1 border-2 border-teal-500 rounded-full inline-block"></span>
                </a>`;
            } catch (err) {
                console.error(`Error generating flag for country: ${flag}`, err);
            }
        }
    }
    return flagElement;
}


function generatePagination(totalItems, itemsPerPage, currentPage, request) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let paginationHtml = '';
    const maxPagesToShow = 5;

    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow);
    if (endPage - startPage < maxPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow);
    }

    if (currentPage > 0) {
        const prevUrl = new URL(request.url);
        prevUrl.searchParams.set('page', currentPage - 1);
        paginationHtml += `<a href="${prevUrl.pathname}${prevUrl.search}" class="px-2 py-1 text-sm mx-0.5 bg-gray-700 text-white rounded-md hover:bg-teal-600 transition-colors dark:bg-white dark:text-gray-900">Prev</a>`;
    }

    for (let i = startPage; i < endPage; i++) {
        const pageNumber = i + 1;
        const activeClass = i === currentPage ? 'bg-teal-600' : 'bg-gray-700 dark:bg-white dark:text-gray-900';
        const pageUrl = new URL(request.url);
        pageUrl.searchParams.set('page', i);
        paginationHtml += `<a href="${pageUrl.pathname}${pageUrl.search}" class="px-2 py-1 text-sm mx-0.5 text-white rounded-md ${activeClass} hover:bg-teal-600 transition-colors">${pageNumber}</a>`;
    }

    if (currentPage < totalPages - 1) {
        const nextUrl = new URL(request.url);
        nextUrl.searchParams.set('page', currentPage + 1);
        paginationHtml += `<a href="${nextUrl.pathname}${nextUrl.search}" class="px-2 py-1 text-sm mx-0.5 bg-gray-700 text-white rounded-md hover:bg-teal-600 transition-colors dark:bg-white dark:text-gray-900">Next</a>`;
    }

    return paginationHtml;
}

async function getKVPrxList(kvPrxUrl = KV_PRX_URL) {
    if (!kvPrxUrl) {
        throw new Error("No URL Provided!");
    }
    const kvPrx = await fetch(kvPrxUrl);
    if (kvPrx.status == 200) {
        return await kvPrx.json();
    } else {
        return {};
    }
}

async function getPrxList(prxBankUrl = PRX_BANK_URL) {
    if (!prxBankUrl) {
        throw new Error("No URL Provided!");
    }
    const prxBank = await fetch(prxBankUrl);
    if (prxBank.status == 200) {
        const text = (await prxBank.text()) || "";
        const prxString = text.split("\n").filter(Boolean);
        cachedPrxList = prxString
            .map((entry) => {
                const [prxIP, prxPort, country, org] = entry.split(",");
                return {
                    prxIP: prxIP || "Unknown",
                    prxPort: prxPort || "Unknown",
                    country: country || "Unknown",
                    org: org || "Unknown Org",
                };
            })
            .filter(Boolean);
    }
    return cachedPrxList;
}

async function reverseWeb(request, target, targetPath) {
    const targetUrl = new URL(request.url);
    const targetChunk = target.split(":");
    targetUrl.hostname = targetChunk[0];
    targetUrl.port = targetChunk[1]?.toString() || "443";
    targetUrl.pathname = targetPath || targetUrl.pathname;
    const modifiedRequest = new Request(targetUrl, request);
    modifiedRequest.headers.set("X-Forwarded-Host", request.headers.get("Host"));
    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    for (const [key, value] of Object.entries(CORS_HEADER_OPTIONS)) {
        newResponse.headers.set(key, value);
    }
    newResponse.headers.set("X-Proxied-By", "Cloudflare Worker");
    return newResponse;
}

// ====================================================================
// ====================================================================
async function getAllConfig(request) {
    const url = new URL(request.url);
    const hostName = url.hostname;
    const page = parseInt(url.searchParams.get('page')) || 0;
    const searchQuery = url.searchParams.get('search') || '';
    const selectedConfigType = url.searchParams.get('configType') || 'tls';

    const proxyList = await getPrxList(PRX_BANK_URL);
    let filteredProxies = proxyList;

    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filteredProxies = proxyList.filter(prx =>
            prx.prxIP.toLowerCase().includes(lowerCaseQuery) ||
            (prx.country && prx.country.toLowerCase() === lowerCaseQuery) ||
            prx.org.toLowerCase().includes(lowerCaseQuery)
        );
    }

    const totalFilteredProxies = filteredProxies.length;
    const startIndex = page * PROXY_PER_PAGE;
    const endIndex = Math.min(startIndex + PROXY_PER_PAGE, totalFilteredProxies);
    const paginatedProxyList = filteredProxies.slice(startIndex, endIndex);

    const tableRows = paginatedProxyList
        .map((prx, index) => {
            const baseId = startIndex + index;
            const uuid = generateUUIDv4();
            const ipPort = `${prx.prxIP}:${prx.prxPort}`;
            const CHECK_API = `https://${url.hostname}/geo-ip?ip=`;
            const healthCheckUrl = `${CHECK_API}${ipPort}`;
            
            let vlessUrl, trojanUrl, ssUrl;

            if (selectedConfigType === 'tls') {
                vlessUrl = new URL(`${atob(flash)}://bug.com`);
                vlessUrl.port = "443";
                vlessUrl.username = uuid;
                vlessUrl.searchParams.set("security", "tls");
                vlessUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                vlessUrl.searchParams.set("host", APP_DOMAIN);
                vlessUrl.searchParams.set("encryption", "none");
                vlessUrl.searchParams.set("type", "ws");
                vlessUrl.searchParams.set("sni", APP_DOMAIN);
                vlessUrl.hash = `${baseId + 1} ${getFlagEmoji(prx.country)} ${prx.org}`;

                trojanUrl = new URL(`${atob(horse)}://bug.com`);
                trojanUrl.port = "443";
                trojanUrl.username = uuid;
                trojanUrl.searchParams.set("security", "tls");
                trojanUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                trojanUrl.searchParams.set("host", APP_DOMAIN);
                trojanUrl.searchParams.set("type", "ws");
                trojanUrl.searchParams.set("sni", APP_DOMAIN);
                trojanUrl.hash = `${baseId + 1} ${getFlagEmoji(prx.country)} ${prx.org}`;

                ssUrl = new URL(`ss://${btoa(`none:${uuid}`)}@${APP_DOMAIN}:443`);
                ssUrl.searchParams.set("encryption", "none");
                ssUrl.searchParams.set("type", "ws");
                ssUrl.searchParams.set("host", APP_DOMAIN);
                ssUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                ssUrl.searchParams.set("security", "tls");
                ssUrl.searchParams.set("sni", APP_DOMAIN);
                ssUrl.hash = `${prx.org} ${getFlagEmoji(prx.country)}`;

            } else { // non-tls
                vlessUrl = new URL(`${atob(flash)}://bug.com`);
                vlessUrl.port = "80";
                vlessUrl.username = uuid;
                vlessUrl.searchParams.set("security", "none");
                vlessUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                vlessUrl.searchParams.set("host", APP_DOMAIN);
                vlessUrl.searchParams.set("encryption", "none");
                vlessUrl.searchParams.set("type", "ws");
                vlessUrl.hash = `${baseId + 1} ${getFlagEmoji(prx.country)} ${prx.org}`;

                trojanUrl = new URL(`${atob(horse)}://bug.com`);
                trojanUrl.port = "80";
                trojanUrl.username = uuid;
                trojanUrl.searchParams.set("security", "none");
                trojanUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                trojanUrl.searchParams.set("host", APP_DOMAIN);
                trojanUrl.searchParams.set("type", "ws");
                trojanUrl.hash = `${baseId + 1} ${getFlagEmoji(prx.country)} ${prx.org}`;

                ssUrl = new URL(`ss://${btoa(`none:${uuid}`)}@${APP_DOMAIN}:80`);
                ssUrl.searchParams.set("encryption", "none");
                ssUrl.searchParams.set("type", "ws");
                ssUrl.searchParams.set("host", APP_DOMAIN);
                ssUrl.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);
                ssUrl.searchParams.set("security", "none");
                ssUrl.hash = `${prx.org} ${getFlagEmoji(prx.country)}`;
            }

            return `
               <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

  <div class="lozad scale-95 mb-4 p-6 bg-blue-300/30 dark:bg-slate-800 rounded-lg shadow-lg border border-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-md flex flex-col">
    
    <div class="flex justify-between items-center">
      <span class="flex items-center">
        <span class="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
        <span class="proxy-status font-bold" id="status-${ipPort}">
          <span class="text-sm">CHECKING...</span>
        </span>
      </span>

      <span class="flex items-center">
        <div class="rounded-full overflow-hidden border-4 border-white dark:border-slate-800">
          <img width="40" src="https://hatscripts.github.io/circle-flags/flags/${prx.country.toLowerCase()}.svg" class="flag-spin" />
        </div>
      </span>
    </div>

    <div class="flex-grow mt-4 py-4 px-4 rounded-lg bg-blue-200/20 dark:bg-slate-700/50">
      <h5 class="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 overflow-x-scroll scrollbar-hide text-nowrap">${prx.org}</h5>
      
      <div class="text-black dark:text-white text-sm">
  <p>IP: ${prx.prxIP}</p>
  <p>Port: ${prx.prxPort}</p>
</div>

      <div class="grid grid-cols-2 gap-2 mt-4 text-sm">
        <button class="w-full p-2 rounded-md text-xs font-semibold text-black dark:text-white bg-yellow-400 hover:bg-yellow-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200" onclick="copyConfig('${vlessUrl.toString()}')">VLESS ${selectedConfigType === 'tls' ? 'TLS' : 'NTLS'}</button>
        <button class="w-full p-2 rounded-md text-xs font-semibold text-black dark:text-white bg-yellow-400 hover:bg-yellow-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200" onclick="copyConfig('${trojanUrl.toString()}')">TROJAN ${selectedConfigType === 'tls' ? 'TLS' : 'NTLS'}</button>
      </div>
      
      <div class="mt-2">
        <button class="w-full p-2 rounded-md text-xs font-semibold text-black dark:text-white bg-yellow-400 hover:bg-yellow-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200" onclick="copyConfig('${ssUrl.toString()}')">SHADOWSOCKS ${selectedConfigType === 'tls' ? 'TLS' : 'NTLS'}</button>
      </div>
    </div>
  </div>
                    <script>
    fetch('${healthCheckUrl}')
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById('status-${ipPort}');
            const status = data.status || 'UNKNOWN';
            let delay = parseFloat(data.delay) || 'N/A';

            if (!isNaN(delay)) {
                delay = Math.round(delay);
            }

            if (status === 'ACTIVE') {
                statusElement.innerHTML = '<span class="text-green-500 font-bold">ACTIVE</span> <span class="text-xs font-normal text-amber-400">(' + delay + 'ms)</span>';
            } else if (status === 'DEAD') {
                statusElement.innerHTML = '<span class="text-red-500 font-bold">DEAD</span>';
            } else {
                statusElement.innerHTML = '<span class="text-cyan-500 font-bold">UNKNOWN</span>';
            }
        })
        .catch(error => {
            const statusElement = document.getElementById('status-${ipPort}');
            statusElement.innerHTML = '<span class="text-red-500 font-bold">ERROR</span>';
        });
</script>
                   
                    <script>
    function toggleDropdown() {
        const dropdownMenu = document.getElementById('dropdown-menu');
        dropdownMenu.classList.toggle('hidden');
    }
</script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      // Tunggu 5 detik sebelum memulai transisi
      setTimeout(() => {
        // Atur opacity menjadi 0 untuk memulai efek fade out
        loadingScreen.style.opacity = '0';
        
        // Setelah efek fade out selesai (500ms), sembunyikan elemen
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500); // Durasi ini harus sama dengan durasi transisi di CSS (duration-500)
      }, 1000); // <-- Ini adalah jeda 5 detik
    }
  });
    
      // Shared
      const rootDomain = "${serviceName}.${rootDomain}";
      const notification = document.getElementById("notification-badge");
      const windowContainer = document.getElementById("container-window");
      const windowInfoContainer = document.getElementById("container-window-info");
      // const converterUrl =
      //   "https://script.google.com/macros/s/AKfycbwwVeHNUlnP92syOP82p1dOk_-xwBgRIxkTjLhxxZ5UXicrGOEVNc5JaSOu0Bgsx_gG/exec";


      // Switches
      let isDomainListFetched = false;

      // Local variable
      let rawConfig = "";

      function getDomainList() {
        if (isDomainListFetched) return;
        isDomainListFetched = true;

        windowInfoContainer.innerText = "Fetching data...";

        const url = "https://" + rootDomain + "/api/v1/domains/get";
        const res = fetch(url).then(async (res) => {
          const domainListContainer = document.getElementById("container-domains");
          domainListContainer.innerHTML = "";

          if (res.status == 200) {
            windowInfoContainer.innerText = "Done!";
            const respJson = await res.json();
            for (const domain of respJson) {
              const domainElement = document.createElement("p");
              domainElement.classList.add("w-full", "bg-amber-400", "rounded-md");
              domainElement.innerText = domain;
              domainListContainer.appendChild(domainElement);
            }
          } else {
            windowInfoContainer.innerText = "Failed!";
          }
        });
      }

      function checkRegion() {
        for (let i = 0; ; i++) {
          const containerRegionCheck = document.getElementById("container-region-check-" + i);
          const configSample = document.getElementById("config-sample-" + i).value.replaceAll(" ", "");
          if (containerRegionCheck == undefined) break;

          const res = fetch(
            "https://api.foolvpn.me/regioncheck?config=" + encodeURIComponent(configSample)
          ).then(async (res) => {
            if (res.status == 200) {
              containerRegionCheck.innerHTML = "<hr>";
              for (const result of await res.json()) {
                containerRegionCheck.innerHTML += "<p>" + result.name + ": " + result.region + "</p>";
              }
            }
          });
        }
      }

      function checkGeoip() {
        const containerIP = document.getElementById("container-info-ip");
        const containerCountry = document.getElementById("container-info-country");
        const containerISP = document.getElementById("container-info-isp");
        const res = fetch("https://" + rootDomain + "/api/v1/myip").then(async (res) => {
          if (res.status == 200) {
            const respJson = await res.json();
            containerIP.innerText = "IP: " + respJson.ip;
            containerCountry.innerText = "Country: " + respJson.country;
            containerISP.innerText = "ISP: " + respJson.asOrganization;
          }
        });
      }

      window.onload = () => {
        checkGeoip();
        const observer = lozad(".lozad", {
          load: function (el) {
            el.classList.remove("scale-95");
          },
        });
        observer.observe();
      };
      
      function showToast(message) {
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => {
                    toast.remove();
                });
            }, 2000);
        }

        function copyConfig(textToCopy) {
            navigator.clipboard.writeText(textToCopy)
               
