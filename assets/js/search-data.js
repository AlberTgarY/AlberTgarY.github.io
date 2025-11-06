// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "Curriculum Vitae of Yicheng (Albert) Zhan",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-500-server-error",
        
          title: '500 Server Error <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.open("https://blog.google/technology/ai/google-gemini-update-flash-ai-assistant-io-2024/", "_blank");
          
        },
      },{id: "post-displaying-external-posts-on-your-al-folio-blog",
        
          title: 'Displaying External Posts on Your al-folio Blog <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.open("https://medium.com/@al-folio/displaying-external-posts-on-your-al-folio-blog-b60a1d241a0a?source=rss-17feae71c3c4------2", "_blank");
          
        },
      },{id: "news-i-started-my-ph-d-journey-at-university-college-london-under-the-supervision-of-dr-kaan-akşit",
          title: 'I started my Ph.D. journey at University College London under the supervision of...',
          description: "",
          section: "News",},{id: "news-our-paper-autocolor-learned-light-power-control-for-multi-color-holograms-is-accepted-at-spie-vr-ar-mr-2024",
          title: 'Our paper AutoColor: Learned Light Power Control for Multi-Color Holograms is accepted at...',
          description: "",
          section: "News",},{id: "news-i-presented-our-paper-focal-surface-holographic-light-transport-using-learned-spatially-adaptive-convolutions-accepted-to-acm-siggraph-asia-2024-technical-communications-in-tokyo-japan",
          title: 'I presented our paper Focal Surface Holographic Light Transport using Learned Spatially Adaptive...',
          description: "",
          section: "News",},{id: "news-i-started-my-position-as-a-research-intern-at-huawei-technologies-r-amp-amp-d-london-uk",
          title: 'I started my position as a Research Intern at Huawei Technologies R&amp;amp;amp;D, London,...',
          description: "",
          section: "News",},{id: "news-our-poster-assessing-learned-models-for-phase-only-hologram-compression-accepted-to-acm-siggraph-2025-poster-track",
          title: 'Our poster Assessing Learned Models for Phase-only Hologram Compression accepted to ACM SIGGRAPH...',
          description: "",
          section: "News",},{id: "news-i-successfully-passed-my-transfer-viva-and-have-officially-transferred-from-the-mphil-to-the-phd-program",
          title: 'I successfully passed my Transfer Viva and have officially transferred from the MPhil...',
          description: "",
          section: "News",},{id: "news-i-attended-frontiers-in-optics-laser-science-and-meta-s-7th-annual-ar-vr-xr-optics-academic-forum-in-denver-usa-i-had-the-opportunity-to-meet-and-talk-with-many-brilliant-researchers-and-professors-it-was-an-inspiring-experience",
          title: 'I attended Frontiers in Optics + Laser Science and Meta’s 7th Annual AR/VR/XR...',
          description: "",
          section: "News",},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%79%69%63%68%65%6E%67_%7A%68%61%6E%32%30%30%31@%6F%75%74%6C%6F%6F%6B.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/AlberTgarY", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/yicheng-zhan-810a75232", "_blank");
        },
      },{
        id: 'social-orcid',
        title: 'ORCID',
        section: 'Socials',
        handler: () => {
          window.open("https://orcid.org/0009-0006-5936-1929", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=x2ptSYUAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
