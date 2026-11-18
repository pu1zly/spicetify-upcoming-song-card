// NAME: upcomingSong (Card Variant)
// ORIGINAL AUTHOR: Fl3xm3ist3r (https://github.com/fl3xm3ist3r)
// DESCRIPTION: Displays the upcoming song near the current song in a card container with marquee text and hover details.

(function upcomingSong() {
    const SPICETIFY_LOAD_INTERVAL_IN_MS = 4000;
    const LOAD_DELAY_IN_MS = 10;
    const ELEMENT_WAIT_TIMEOUT_IN_MS = 30000;

    function waitForSpicetifyLoad() {
        if (!Spicetify.Player.data || !Spicetify.LocalStorage) {
            setTimeout(waitForSpicetifyLoad, SPICETIFY_LOAD_INTERVAL_IN_MS);
            return;
        }

        addUpcomingSong();
    }

    function waitForElement(selector, timeout = ELEMENT_WAIT_TIMEOUT_IN_MS) {
        const existingElement = document.querySelector(selector);

        if (existingElement) {
            return Promise.resolve(existingElement);
        }

        return new Promise((resolve, reject) => {
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);

                if (element) {
                    observer.disconnect();
                    clearTimeout(timeoutId);
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timed out waiting for element: ${selector}`));
            }, timeout);
        });
    }

    async function addUpcomingSong() {
        try {
            const nowPlayingLeft = await waitForElement(".main-nowPlayingBar-left");

            if (document.getElementById("upcomingSongDiv")) {
                return;
            }

            addCustomCss();
            addEventListeners();

            injectUpcomingSong(nowPlayingLeft);

            addCompatibilityForOtherExtensions();
            observeUpcomingSong();

            setTimeout(updateUpcomingSong, LOAD_DELAY_IN_MS);
        } catch (error) {
            console.error("[upcomingSong] Failed to inject extension:", error);
        }
    }

    function injectUpcomingSong(nowPlayingLeft) {
        if (!nowPlayingLeft || document.getElementById("upcomingSongDiv")) {
            return;
        }

        const upcomingSongDiv = createUpcomingSongDiv();
        nowPlayingLeft.appendChild(upcomingSongDiv);

        const upcomingSongSkipDiv = document.getElementById("upcomingSongSkipDiv");

        upcomingSongSkipDiv.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            Spicetify.Player.next();
        });
    }

    function observeUpcomingSong() {
        const observer = new MutationObserver(() => {
            const nowPlayingLeft = document.querySelector(".main-nowPlayingBar-left");
            const upcomingSongDiv = document.getElementById("upcomingSongDiv");

            if (nowPlayingLeft && !upcomingSongDiv) {
                console.log("[upcomingSong] Upcoming song element was removed. Re-injecting...");

                injectUpcomingSong(nowPlayingLeft);

                setTimeout(updateUpcomingSong, LOAD_DELAY_IN_MS);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function addCustomCss() {
        const styleElement = document.createElement("style");
        styleElement.textContent = `
            /* Left section flex layout - pack items with 20px gap */
            .main-nowPlayingBar-left {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 20px !important;
                min-width: 0 !important;
                overflow: visible !important;
            }
            
            /* Make current song only take needed width */
            .main-nowPlayingWidget-nowPlaying {
                box-sizing: border-box;
                flex: 0 1 auto !important;
                min-width: 0 !important;
                max-width: fit-content;
            }
            
            #upcomingSongDiv {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                min-width: 0;
                width: 213px;
                max-width: 213px;
                flex: 0 1 213px;
                position: relative;
                overflow: visible;
                transition: transform 0.2s cubic-bezier(0.3, 0, 0, 1);
            }

            /* Card container - fixed 213px width by default, shrinks gracefully if window gets smaller */
            .upcoming-card-container {
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255, 255, 255, 0.07);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: 6px 14px 6px 8px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                width: 213px;
                max-width: 100%;
                min-width: 0;
                box-sizing: border-box;
                position: relative;
                overflow: visible;
            }

            /* Card hover - only lights up with subtle green glow (no movement) */
            .upcoming-card-container:hover {
                background: rgba(255, 255, 255, 0.14);
                border-color: rgba(30, 215, 96, 0.6);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 14px rgba(30, 215, 96, 0.25);
            }

            /* Floating full-title popup above the card on hover */
            .upcoming-tooltip {
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 20, 20, 0.96);
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 8px;
                padding: 8px 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75), 0 0 10px rgba(30, 215, 96, 0.15);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                min-width: 160px;
                max-width: 320px;
                width: max-content;
                pointer-events: none;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                z-index: 999999;
                box-sizing: border-box;
                text-align: left;
            }

            .upcoming-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border-width: 6px 6px 0 6px;
                border-style: solid;
                border-color: rgba(20, 20, 20, 0.96) transparent transparent transparent;
            }

            .upcoming-card-container:hover .upcoming-tooltip {
                opacity: 1;
                visibility: visible;
            }

            .upcoming-tooltip-badge {
                color: #1ed760;
                font-size: 0.58rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 4px;
                line-height: 1;
            }

            .upcoming-tooltip-title {
                font-size: 0.78rem;
                font-weight: 600;
                color: #ffffff;
                white-space: normal;
                word-break: break-word;
                line-height: 1.25;
            }

            .upcoming-tooltip-artist {
                font-size: 0.68rem;
                color: #b3b3b3;
                margin-top: 3px;
                white-space: normal;
                word-break: break-word;
                line-height: 1.2;
            }

            /* Spotify Green "Next Up" Badge */
            .upcoming-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                color: #1ed760;
                font-size: 0.58rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                line-height: 1;
                margin-bottom: 3px;
            }

            .upcoming-badge-dot {
                width: 4px;
                height: 4px;
                background-color: #1ed760;
                border-radius: 50%;
                box-shadow: 0 0 5px #1ed760;
                display: inline-block;
                flex-shrink: 0;
            }

            /* Circular Album Cover with Border Design */
            .upcoming-cover-container {
                position: relative;
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #upcomingSongImg {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #1ed760;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 8px rgba(30, 215, 96, 0.35);
                transition: box-shadow 0.2s ease, border-color 0.2s ease;
                display: block;
            }

            .upcoming-card-container:hover #upcomingSongImg {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(30, 215, 96, 0.6);
            }

            /* Text Container & Marquee Rows */
            .upcoming-info-container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
                flex: 1 1 auto;
                overflow: hidden;
                padding-right: 2px;
            }

            .upcoming-text-row {
                width: 100%;
                min-width: 0;
                overflow: hidden;
                position: relative;
                white-space: nowrap;
            }

            /* Smooth fade mask only when text significantly overflows */
            .upcoming-text-row.has-overflow {
                mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 14px), transparent 100%);
                -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 14px), transparent 100%);
            }

            .upcoming-marquee-content {
                display: inline-block;
                white-space: nowrap;
                will-change: transform;
            }

            .upcoming-marquee-content.marquee-animating {
                animation-name: upcomingMarqueeAnimation;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
                animation-delay: 1.2s;
            }

            @keyframes upcomingMarqueeAnimation {
                0%, 20% {
                    transform: translateX(0);
                }
                70%, 85% {
                    transform: translateX(var(--marquee-distance, 0px));
                }
                100% {
                    transform: translateX(0);
                }
            }

            #upcomingSongTitle {
                font-size: 0.74rem;
                font-weight: 600;
                color: #ffffff;
                text-decoration: none;
                line-height: 1.25;
                margin-bottom: 2px;
                display: block;
            }

            #upcomingSongTitle:hover {
                text-decoration: underline;
            }

            #upcomingSongArtist {
                font-size: 0.64rem;
                color: #b3b3b3;
                text-decoration: none;
                line-height: 1.2;
                display: block;
            }

            #upcomingSongArtist:hover {
                color: #ffffff;
                text-decoration: underline;
            }
        `;
        document.head.appendChild(styleElement);
    }

    function addEventListeners() {
        const shuffleButton = document.querySelector(".main-shuffleButton-button");

        if (shuffleButton) {
            shuffleButton.addEventListener("click", function () {
                setTimeout(updateUpcomingSong, LOAD_DELAY_IN_MS);
            });
        }

        Spicetify.Player.addEventListener("songchange", () => {
            setTimeout(updateUpcomingSong, LOAD_DELAY_IN_MS);
        });

        Spicetify.Platform.PlayerAPI._queue._events.addListener("queue_update", (eventData) => {
            if (Spicetify.Queue.nextTracks != null && Spicetify.Queue.nextTracks[0]) {
                if (Spicetify.Queue.nextTracks[0].contextTrack.uid != Spicetify.Queue.track.contextTrack.uid) {
                    setTimeout(updateUpcomingSong, LOAD_DELAY_IN_MS);
                }
            }
        });

        window.addEventListener("resize", () => {
            const upcomingSongTitle = document.getElementById("upcomingSongTitle");
            const upcomingSongArtist = document.getElementById("upcomingSongArtist");
            applyMarquee(upcomingSongTitle);
            applyMarquee(upcomingSongArtist);
        });
    }

    function addCompatibilityForOtherExtensions() {
        // hide upcoming song in full screen
        document.addEventListener("fullscreenchange", function () {
            recalculateUpcomingSongLayout();
        });
    }

    function createUpcomingSongDiv() {
        const upcomingSongDiv = document.createElement("div");
        upcomingSongDiv.setAttribute("id", "upcomingSongDiv");
        upcomingSongDiv.innerHTML = `
            <div id="upcomingSongSkipDiv" class="upcoming-card-container">
                <!-- Floating full-title preview popup above the card on hover -->
                <div class="upcoming-tooltip">
                    <div class="upcoming-tooltip-badge">Next Up</div>
                    <div id="upcomingTooltipTitle" class="upcoming-tooltip-title"></div>
                    <div id="upcomingTooltipArtist" class="upcoming-tooltip-artist"></div>
                </div>

                <div class="upcoming-cover-container">
                    <img id="upcomingSongImg" aria-hidden="false" draggable="false" loading="eager" src="" alt="Upcoming Track Art" />
                </div>
                <div class="upcoming-info-container">
                    <div class="upcoming-badge">
                        <span class="upcoming-badge-dot"></span>
                        <span>Next Up</span>
                    </div>
                    <div class="upcoming-text-row">
                        <a id="upcomingSongTitle" class="upcoming-marquee-content" draggable="false" dir="auto"></a>
                    </div>
                    <div class="upcoming-text-row">
                        <a id="upcomingSongArtist" class="upcoming-marquee-content" draggable="false" dir="auto"></a>
                    </div>
                </div>
            </div>
        `;

        return upcomingSongDiv;
    }

    function applyMarquee(element) {
        if (!element) return;

        element.classList.remove("marquee-animating");
        element.style.removeProperty("--marquee-distance");
        element.style.removeProperty("animation-duration");
        const container = element.parentElement;
        if (container) {
            container.classList.remove("has-overflow");
        }

        // Delay slightly for layout to settle
        requestAnimationFrame(() => {
            if (!element.parentElement) return;
            const container = element.parentElement;
            const overflow = element.scrollWidth - container.clientWidth;

            // Only trigger marquee when overflow is meaningful (> 8px)
            if (overflow > 8) {
                element.style.setProperty("--marquee-distance", `-${overflow + 8}px`);
                const duration = Math.max(5, Math.min(15, 3.5 + overflow / 20));
                element.style.setProperty("animation-duration", `${duration}s`);
                element.classList.add("marquee-animating");
                container.classList.add("has-overflow");
            }
        });
    }

    function updateUpcomingSong() {
        const queue = Spicetify.Queue;
        var nextTrack = null;

        for (let i = 0; i < queue.nextTracks.length; i++) {
            var tmpNextTrack = queue.nextTracks[i];

            if (
                !tmpNextTrack.removed.length &&
                tmpNextTrack.contextTrack.uid != Spicetify.Queue.track.contextTrack.uid
            ) {
                nextTrack = tmpNextTrack;
                break;
            }
        }

        const upcomingSongTitle = document.getElementById("upcomingSongTitle");
        const upcomingSongArtist = document.getElementById("upcomingSongArtist");
        const upcomingTooltipTitle = document.getElementById("upcomingTooltipTitle");
        const upcomingTooltipArtist = document.getElementById("upcomingTooltipArtist");
        const upcomingSongImg = document.getElementById("upcomingSongImg");

        if (nextTrack) {
            const title = nextTrack.contextTrack.metadata.title || "Unknown Title";
            let artist = nextTrack.contextTrack.metadata.artist_name || "";

            for (let i = 1; i > 0; i++) {
                if (nextTrack.contextTrack.metadata["artist_name:" + i]) {
                    artist += ", " + nextTrack.contextTrack.metadata["artist_name:" + i];
                } else {
                    break;
                }
            }

            upcomingSongTitle.innerText = title;
            upcomingSongArtist.innerText = artist;

            if (upcomingTooltipTitle) upcomingTooltipTitle.innerText = title;
            if (upcomingTooltipArtist) upcomingTooltipArtist.innerText = artist;

            if (!nextTrack.contextTrack.metadata.image_url) {
                upcomingSongImg.style.display = "none";
            } else {
                upcomingSongImg.style.display = "block";
                upcomingSongImg.src = nextTrack.contextTrack.metadata.image_url;
            }
        } else {
            upcomingSongTitle.innerText = "NoSongWasFound";
        }

        recalculateUpcomingSongLayout();
    }

    function recalculateUpcomingSongLayout() {
        const currentSong = document.querySelector(".main-nowPlayingWidget-nowPlaying:not(#upcomingSongDiv)");
        const upcomingSong = document.querySelector("#upcomingSongDiv");
        const upcomingSongTitle = document.getElementById("upcomingSongTitle");
        const upcomingSongArtist = document.getElementById("upcomingSongArtist");

        if (!upcomingSong) return;

        // no upcoming song was found
        if (!upcomingSongTitle || upcomingSongTitle.innerText === "NoSongWasFound") {
            if (currentSong) {
                currentSong.style.flex = "0 1 auto";
                currentSong.style.maxWidth = "100%";
            }
            upcomingSong.style.setProperty("display", "none", "important");
            return;
        }

        upcomingSong.style.display = "flex";

        if (currentSong) {
            currentSong.style.minWidth = "0";
            currentSong.style.flex = "0 1 auto";
            currentSong.style.maxWidth = "calc(100% - 140px)";
            currentSong.style.overflow = "hidden";

            // ensure upcomingSong appears behind currentSong
            if (
                currentSong.parentElement &&
                currentSong.parentElement.children[1] &&
                currentSong.parentElement.children[1].getAttribute("id") !== "upcomingSongDiv"
            ) {
                upcomingSong.remove();
                currentSong.parentElement.appendChild(upcomingSong);
            }
        }

        checkIfFullScreen();

        // recalculate marquee after layout is updated
        applyMarquee(upcomingSongTitle);
        applyMarquee(upcomingSongArtist);
    }

    function checkIfFullScreen() {
        const upcomingSongDiv = document.querySelector("#upcomingSongDiv");

        if (upcomingSongDiv) {
            if (document.fullscreenElement) {
                upcomingSongDiv.style.setProperty("display", "none", "important");
            } else {
                upcomingSongDiv.style.display = "flex";
            }
        }
    }

    waitForSpicetifyLoad();
})();
