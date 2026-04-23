const namespace = "${fragmentEntryLinkNamespace}";

class LeafletMap {
    constructor(config) {
        this.config = config || {};
        this.lat = parseFloat(this.config.initialLat) || 40.4168;
        this.lng = parseFloat(this.config.initialLng) || -3.7038;
        this.zoom = parseInt(this.config.initialZoom) || 6;
        this.obj = this.config.objectRESTName || 'plantas';
        this.country = this.config.labelCountry || 'España';
        
        this.map = null;
        this.allPlants = []; 
        this.markers = [];    
        this.currentIdx = -1; // Para rastrear la navegación por teclado

        // URL configurada para traer los campos necesarios
        this.apiUrl = `/o/c/${this.obj}/?fields=id,nombre,latitud,longitud,comunidadAutonoma,potenciaMW&pageSize=-1`;
    }

    async initialize() {
        if (typeof L === 'undefined') {
            setTimeout(() => this.initialize(), 100);
            return;
        }

        // Inicializamos mapa con soporte de teclado
        this.map = L.map("maps-toolkit-leaflet-map", {
            scrollWheelZoom: false,
            zoomSnap: 0.1,
            keyboard: true
        }).setView([this.lat, this.lng], this.zoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; CARTO"
        }).addTo(this.map);

        await this.loadData();
        this.setupListeners();
        this.setupAccessibility();
    }

    async loadData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error("Error API");
            const data = await response.json();
            
            if (data && data.items) {
                this.allPlants = data.items;
                this.populateFilter(data.items);
                this.renderPoints(data.items);
                this.updateDashboards('all');
                this.injectJSONLD(data.items);
            }
        } catch (e) { console.error("Fallo carga:", e); }
    }

    renderPoints(items) {
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];

        items.forEach((planta) => {
            const marker = L.circleMarker([planta.latitud, planta.longitud], {
                radius: 8, 
                fillColor: "#84b404", 
                color: "#ffffff", 
                weight: 2, 
                fillOpacity: 0.9
            }).addTo(this.map);

            // ACCESIBILIDAD: Convertimos el círculo SVG en un elemento interactivo
            const element = marker._path; 
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', `Planta: ${planta.nombre || planta.id}`);
            element.setAttribute('tabindex', '0'); 

            marker.bindPopup(`<div id="popup-${planta.id}" style="min-height:100px; min-width:250px;">Cargando...</div>`);
            marker.on('popupopen', () => this.loadPlantDetail(planta.id));
            
            // Abrir con Enter o Espacio
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    marker.openPopup();
                }
            });

            marker.ccaaKey = planta.comunidadAutonoma?.key;
            this.markers.push(marker);
        });
    }

    setupAccessibility() {
        document.addEventListener('keydown', (e) => {
            const mapContainer = document.getElementById('maps-toolkit-leaflet-map');
            if (!mapContainer.contains(document.activeElement)) return;

            // Navegación entre puntos con flechas
            if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    this.currentIdx = (this.currentIdx + 1) % this.markers.length;
                } else {
                    this.currentIdx = (this.currentIdx - 1 + this.markers.length) % this.markers.length;
                }
                
                const targetMarker = this.markers[this.currentIdx];
                if (targetMarker) {
                    this.map.panTo(targetMarker.getLatLng());
                    targetMarker._path.focus();
                }
            }
        });
    }

    updateDashboards(filterKey) {
        const filtered = (filterKey === 'all') 
            ? this.allPlants 
            : this.allPlants.filter(p => p.comunidadAutonoma && p.comunidadAutonoma.key === filterKey);

        const totalPower = filtered.reduce((acc, p) => acc + (parseFloat(p.potenciaMW) || 0), 0);
        
        document.getElementById('stat-count').textContent = filtered.length;
        document.getElementById('stat-power').textContent = `${totalPower.toLocaleString('de-DE')} MW`;

        let regionDisplay = this.country;
        if (filterKey !== 'all') {
            const first = filtered.find(p => p.comunidadAutonoma?.key === filterKey);
            regionDisplay = first ? first.comunidadAutonoma.name : filterKey;
        }
        document.getElementById('label-count').textContent = `Instalaciones en ${regionDisplay}`;
        document.getElementById('label-power').textContent = `Capacidad en ${regionDisplay}`;

        this.markers.forEach(m => {
            if (filterKey === 'all' || m.ccaaKey === filterKey) {
                m.setStyle({ opacity: 1, fillOpacity: 0.9, radius: 8 });
                m._path.style.display = ""; // Asegurar visibilidad para teclado
            } else {
                m.setStyle({ opacity: 0, fillOpacity: 0, radius: 0 });
                m._path.style.display = "none";
            }
        });

        if (filterKey !== 'all' && filtered.length > 0) {
            const activeMarkers = this.markers.filter(m => m.ccaaKey === filterKey);
            const group = L.featureGroup(activeMarkers);
            this.map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 10 });
            this.currentIdx = -1; // Reset navegación al filtrar
        } else if (filterKey === 'all') {
            this.map.setView([this.lat, this.lng], this.zoom);
        }
    }

    async loadPlantDetail(id) {
        const container = document.getElementById(`popup-${id}`);
        if (!container || container.dataset.loaded) return;
        try {
            const res = await fetch(`/o/c/${this.obj}/${id}?fields=nombre,potenciaMW,descripcion,imagen`);
            const detail = await res.json();
            const img = detail.imagen?.thumbnailURL || '';
            container.dataset.loaded = "true";
            container.innerHTML = `
                <div style="font-family: sans-serif;">
                    ${img ? `<img src="${img}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;"/>` : ''}
                    <h6 style="color:#3d854d; margin:0; font-weight:bold;">${detail.nombre || 'Planta'}</h6>
                    <p style="font-size:11px; color:#666;">${detail.descripcion || ''}</p>
                    <div style="font-weight:bold; border-top:1px solid #eee; padding-top:8px; font-size:12px;">Potencia: ${detail.potenciaMW} MW</div>
                </div>`;
        } catch (e) { container.innerHTML = "Error."; }
    }

    populateFilter(items) {
        const select = document.getElementById('filter-ccaa');
        if (!select) return;
        const mapCCAA = new Map();
        items.forEach(item => {
            const ccaa = item.comunidadAutonoma;
            if (ccaa && ccaa.key) mapCCAA.set(ccaa.key, ccaa.name);
        });
        const sorted = Array.from(mapCCAA.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        sorted.forEach(([key, name]) => {
            const opt = document.createElement('option');
            opt.value = key; opt.textContent = name;
            select.appendChild(opt);
        });
    }

    injectJSONLD(items) {
        const oldScript = document.getElementById('jsonld-geo-metadata');
        if (oldScript) oldScript.remove();
        const jsonLD = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `Directorio Iberdrola ${this.country}`,
            "itemListElement": items.map((planta, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": ["LocalBusiness", "CivicStructure"],
                    "additionalType": "https://www.wikidata.org/wiki/Q789782",
                    "name": planta.nombre || `Instalación ${index + 1}`,
                    "geo": { "@type": "GeoCoordinates", "latitude": planta.latitud, "longitude": planta.longitud },
                    "address": { "@type": "PostalAddress", "addressRegion": planta.comunidadAutonoma?.name || "", "addressCountry": this.country }
                }
            }))
        };
        const script = document.createElement('script');
        script.id = 'jsonld-geo-metadata'; script.type = 'application/ld+json';
        script.text = JSON.stringify(jsonLD);
        document.head.appendChild(script);
    }

    setupListeners() {
        const sel = document.getElementById('filter-ccaa');
        if (sel) sel.addEventListener('change', (e) => this.updateDashboards(e.target.value));
    }
}

try {
    const leafletMap = new LeafletMap(typeof configuration !== 'undefined' ? configuration : {});
    leafletMap.initialize();
} catch (err) { console.error("Error:", err); }