/* =========================================================================
   DESIGN LAB ENGINE
   Applies the design lab options (5 design languages × light / dark / high
   contrast, sizes, density, accents, fonts, radius, elevation, motion,
   icon stroke, navbar style) before first paint. Exposes window.KagamiLab.

   Provides: D, LAB, get, put, LANGS, SIZES, DENS, ACCENTS, FONTS, MONOS,
   RADII, ELEVS, MOTIONS, ICONS, FORMS, FITS, NAVCOLORS, NAVSUBS, NAVDEF,
   NAVPRESETS, hexOk, cleanNav, lumHex, navVars, setNav, navPreset,
   ICON_SW, RADIUS, DEF, OPT, KM, KHC, KCARD, KFONT, st, subs, px, css, mx,
   metrics, sizeInfo, themeKey, effColor, roleColors, roleColor,
   tokenBlock, userBlock, apply, save, notify, set, reset, cardTokens,
   langFont
   ========================================================================= */

/* ============ DESIGN LAB ENGINE (runs before first paint) ============
   Applies the Enterprise UX Lab options to the whole ERP:
   5 design languages x light / dark / high contrast, 5 sizes, 3 densities (density lives in kagami-density),
   semantic accent roles, fonts, corner radius, elevation, motion and icon stroke.
   Language palettes below are resolved from the lab's tokens.css. */
(function () {
  var D = document.documentElement;
  var LAB = {
    a: {
      light: {
        pri: '#1D5BD6',
        'pri-h': '#1849B0',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E9F0FD',
        'pri-txt': '#1D5BD6',
        fg: '#172033',
        fg2: '#44536B',
        fg3: '#67748A',
        bg: '#FFFFFF',
        sunk: '#F4F5F7',
        fill: '#EEF0F3',
        'fill-h': '#E2E5EA',
        bd: '#DCDFE4',
        'bd-strong': '#B8C0CC',
        ok: '#1F7A4F',
        'ok-bg': '#DFF7EA',
        warn: '#9E4A00',
        'warn-bg': '#FFF3D6',
        err: '#C2321F',
        'err-bg': '#FFECEA',
        inf: '#1D5BD6',
        'inf-bg': '#E9F0FD',
        new: '#6A4FC8',
        'new-bg': '#F1EDFD',
        inv: '#22324A',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(9,22,48,.54)',
        'r-s': '3px',
        r: '4px',
        'r-l': '6px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '12px',
        'px-l': '16px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 1px 1px rgba(23,43,77,.22),0 0 1px rgba(23,43,77,.32)',
        'sh-2': '0 8px 12px rgba(23,43,77,.15),0 0 1px rgba(23,43,77,.32)',
        'sh-3': '0 12px 28px rgba(23,43,77,.2),0 0 1px rgba(23,43,77,.32)',
        font: '"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
        'ic-sw': '2',
        dur: '.1s',
        ease: 'cubic-bezier(.15,1,.3,1)'
      },
      dark: {
        pri: '#5B8FF0',
        'pri-h': '#79A4F3',
        'on-pri': '#0D1526',
        'pri-sub': '#1C2A47',
        'pri-txt': '#7CA6F4',
        fg: '#DCE1EA',
        fg2: '#A9B3C3',
        fg3: '#8792A5',
        bg: '#1E2228',
        sunk: '#16191D',
        fill: '#2C323A',
        'fill-h': '#353C46',
        bd: '#363D47',
        'bd-strong': '#4F5867',
        ok: '#4FCB93',
        'ok-bg': '#143528',
        warn: '#F2A54C',
        'warn-bg': '#3A2A12',
        err: '#F47D6C',
        'err-bg': '#41211D',
        inf: '#5B8FF0',
        'inf-bg': '#1C2A47',
        new: '#A897F2',
        'new-bg': '#2A2347',
        inv: '#DCE1EA',
        'on-inv': '#16191D',
        blanket: 'rgba(4,8,16,.62)',
        'r-s': '3px',
        r: '4px',
        'r-l': '6px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '12px',
        'px-l': '16px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 1px 1px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.05)',
        'sh-2': '0 8px 16px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08)',
        'sh-3': '0 16px 36px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08)',
        font: '"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
        'ic-sw': '2',
        dur: '.1s',
        ease: 'cubic-bezier(.15,1,.3,1)'
      },
      hc: {
        pri: '#0039A6',
        'pri-h': '#002A7A',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E0E8F8',
        'pri-txt': '#0039A6',
        fg: '#000000',
        fg2: '#1A1A1A',
        fg3: '#2E2E2E',
        bg: '#FFFFFF',
        sunk: '#FFFFFF',
        fill: '#FFFFFF',
        'fill-h': '#E6E6E6',
        bd: '#000000',
        'bd-strong': '#000000',
        ok: '#00602F',
        'ok-bg': '#DFF7EA',
        warn: '#6B3A00',
        'warn-bg': '#FFF3D6',
        err: '#A30000',
        'err-bg': '#FFECEA',
        inf: '#0039A6',
        'inf-bg': '#E9F0FD',
        new: '#6A4FC8',
        'new-bg': '#F1EDFD',
        inv: '#22324A',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '3px',
        r: '4px',
        'r-l': '6px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '12px',
        'px-l': '16px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 0 0 1px #000000',
        'sh-2': '0 0 0 2px #000000',
        'sh-3': '0 0 0 2px #000000',
        font: '"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
        'ic-sw': '2',
        dur: '.1s',
        ease: 'cubic-bezier(.15,1,.3,1)'
      }
    },
    f: {
      light: {
        pri: '#1760B8',
        'pri-h': '#11519E',
        'on-pri': '#FFFFFF',
        'pri-sub': '#EBF3FC',
        'pri-txt': '#1760B8',
        fg: '#242424',
        fg2: '#5B5B5B',
        fg3: '#707070',
        bg: '#FFFFFF',
        sunk: '#F5F5F5',
        fill: '#FFFFFF',
        'fill-h': '#F5F5F5',
        bd: '#D1D1D1',
        'bd-strong': '#616161',
        ok: '#107C10',
        'ok-bg': '#F1FAF1',
        warn: '#A84B08',
        'warn-bg': '#FFF9F5',
        err: '#C42B1C',
        'err-bg': '#FDF3F4',
        inf: '#1760B8',
        'inf-bg': '#F0F6FD',
        new: '#5B5FC7',
        'new-bg': '#F5F5FC',
        inv: '#2E2E2E',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(0,0,0,.4)',
        'r-s': '2px',
        r: '4px',
        'r-l': '8px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '14px',
        'px-l': '18px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 0 2px rgba(0,0,0,.12),0 2px 4px rgba(0,0,0,.14)',
        'sh-2': '0 0 2px rgba(0,0,0,.12),0 8px 16px rgba(0,0,0,.14)',
        'sh-3': '0 0 8px rgba(0,0,0,.12),0 32px 64px rgba(0,0,0,.14)',
        font: '"Segoe UI Variable Text","Segoe UI","Open Sans",system-ui,sans-serif',
        'ic-sw': '1.5',
        dur: '.15s',
        ease: 'cubic-bezier(.1,.9,.2,1)'
      },
      dark: {
        pri: '#1F6FC5',
        'pri-h': '#2D82DA',
        'on-pri': '#FFFFFF',
        'pri-sub': '#0E2A47',
        'pri-txt': '#62A9F5',
        fg: '#FFFFFF',
        fg2: '#D6D6D6',
        fg3: '#ADADAD',
        bg: '#292929',
        sunk: '#242424',
        fill: '#292929',
        'fill-h': '#3D3D3D',
        bd: '#5C5C5C',
        'bd-strong': '#ADADAD',
        ok: '#5EBF5E',
        'ok-bg': '#0C2A0C',
        warn: '#F59B5C',
        'warn-bg': '#3A1A06',
        err: '#E3727C',
        'err-bg': '#3B1316',
        inf: '#1F6FC5',
        'inf-bg': '#10243A',
        new: '#9EA2F2',
        'new-bg': '#24254A',
        inv: '#F0F0F0',
        'on-inv': '#242424',
        blanket: 'rgba(0,0,0,.55)',
        'r-s': '2px',
        r: '4px',
        'r-l': '8px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '14px',
        'px-l': '18px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 0 2px rgba(0,0,0,.24),0 2px 4px rgba(0,0,0,.28)',
        'sh-2': '0 0 2px rgba(0,0,0,.24),0 8px 16px rgba(0,0,0,.28)',
        'sh-3': '0 0 8px rgba(0,0,0,.24),0 32px 64px rgba(0,0,0,.28)',
        font: '"Segoe UI Variable Text","Segoe UI","Open Sans",system-ui,sans-serif',
        'ic-sw': '1.5',
        dur: '.15s',
        ease: 'cubic-bezier(.1,.9,.2,1)'
      },
      hc: {
        pri: '#0B3F82',
        'pri-h': '#082E61',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E0E8F2',
        'pri-txt': '#0B3F82',
        fg: '#000000',
        fg2: '#1A1A1A',
        fg3: '#2E2E2E',
        bg: '#FFFFFF',
        sunk: '#FFFFFF',
        fill: '#FFFFFF',
        'fill-h': '#F5F5F5',
        bd: '#000000',
        'bd-strong': '#000000',
        ok: '#0B5A0B',
        'ok-bg': '#F1FAF1',
        warn: '#6B3A00',
        'warn-bg': '#FFF9F5',
        err: '#A30000',
        'err-bg': '#FDF3F4',
        inf: '#0B3F82',
        'inf-bg': '#F0F6FD',
        new: '#5B5FC7',
        'new-bg': '#F5F5FC',
        inv: '#2E2E2E',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '2px',
        r: '4px',
        'r-l': '8px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '8px',
        'px-m': '14px',
        'px-l': '18px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 0 0 1px #000000',
        'sh-2': '0 0 0 2px #000000',
        'sh-3': '0 0 0 2px #000000',
        font: '"Segoe UI Variable Text","Segoe UI","Open Sans",system-ui,sans-serif',
        'ic-sw': '1.5',
        dur: '.15s',
        ease: 'cubic-bezier(.1,.9,.2,1)'
      }
    },
    p: {
      light: {
        pri: '#2470E8',
        'pri-h': '#3B80EE',
        'on-pri': '#FFFFFF',
        'pri-sub': 'rgba(36,112,232,.12)',
        'pri-txt': '#2470E8',
        fg: '#1B1B1F',
        fg2: '#6C6C74',
        fg3: '#9C9CA3',
        bg: '#FFFFFF',
        sunk: '#F4F4F7',
        fill: 'rgba(120,120,128,.12)',
        'fill-h': 'rgba(120,120,128,.18)',
        bd: 'rgba(60,60,67,.12)',
        'bd-strong': 'rgba(60,60,67,.28)',
        ok: '#2AA54A',
        'ok-bg': 'rgba(42,165,74,.12)',
        warn: '#C77100',
        'warn-bg': 'rgba(255,159,10,.14)',
        err: '#E0352B',
        'err-bg': 'rgba(224,53,43,.10)',
        inf: '#2470E8',
        'inf-bg': 'rgba(36,112,232,.10)',
        new: '#8A4FD8',
        'new-bg': 'rgba(138,79,216,.12)',
        inv: 'rgba(30,30,34,.92)',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(20,20,24,.22)',
        'r-s': '6px',
        r: '10px',
        'r-l': '14px',
        'h-s': '28px',
        'h-m': '36px',
        'h-l': '44px',
        'px-s': '12px',
        'px-m': '18px',
        'px-l': '22px',
        'fs-s': '13px',
        fs: '15px',
        'fs-l': '17px',
        'sh-1': '0 1px 2px rgba(0,0,0,.04),0 0 0 .5px rgba(0,0,0,.04)',
        'sh-2': '0 10px 30px rgba(0,0,0,.12),0 0 0 .5px rgba(0,0,0,.08)',
        'sh-3': '0 24px 64px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.08)',
        font: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Helvetica Neue",system-ui,sans-serif',
        'ic-sw': '1.7',
        dur: '.25s',
        ease: 'cubic-bezier(.32,.72,0,1)'
      },
      dark: {
        pri: '#3D8BF5',
        'pri-h': '#5A9DF7',
        'on-pri': '#FFFFFF',
        'pri-sub': 'rgba(61,139,245,.2)',
        'pri-txt': '#5A9DF7',
        fg: '#F4F4F6',
        fg2: '#A3A3AA',
        fg3: '#76767E',
        bg: '#1C1C1F',
        sunk: '#0F0F11',
        fill: 'rgba(120,120,128,.24)',
        'fill-h': 'rgba(120,120,128,.32)',
        bd: 'rgba(235,235,245,.1)',
        'bd-strong': 'rgba(235,235,245,.24)',
        ok: '#34C05A',
        'ok-bg': 'rgba(52,192,90,.16)',
        warn: '#FFA51F',
        'warn-bg': 'rgba(255,165,31,.16)',
        err: '#FF5147',
        'err-bg': 'rgba(255,81,71,.16)',
        inf: '#3D8BF5',
        'inf-bg': 'rgba(61,139,245,.16)',
        new: '#B57BFF',
        'new-bg': 'rgba(181,123,255,.16)',
        inv: 'rgba(240,240,244,.94)',
        'on-inv': '#1B1B1F',
        blanket: 'rgba(0,0,0,.45)',
        'r-s': '6px',
        r: '10px',
        'r-l': '14px',
        'h-s': '28px',
        'h-m': '36px',
        'h-l': '44px',
        'px-s': '12px',
        'px-m': '18px',
        'px-l': '22px',
        'fs-s': '13px',
        fs: '15px',
        'fs-l': '17px',
        'sh-1': '0 0 0 .5px rgba(255,255,255,.06)',
        'sh-2': '0 10px 30px rgba(0,0,0,.45),0 0 0 .5px rgba(255,255,255,.1)',
        'sh-3': '0 24px 64px rgba(0,0,0,.55),0 0 0 .5px rgba(255,255,255,.1)',
        font: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Helvetica Neue",system-ui,sans-serif',
        'ic-sw': '1.7',
        dur: '.25s',
        ease: 'cubic-bezier(.32,.72,0,1)'
      },
      hc: {
        pri: '#0A4FB8',
        'pri-h': '#083F94',
        'on-pri': '#FFFFFF',
        'pri-sub': 'rgba(36,112,232,.12)',
        'pri-txt': '#0A4FB8',
        fg: '#000000',
        fg2: '#1A1A1A',
        fg3: '#2E2E2E',
        bg: '#FFFFFF',
        sunk: '#FFFFFF',
        fill: 'rgba(0,0,0,.08)',
        'fill-h': 'rgba(120,120,128,.18)',
        bd: '#000000',
        'bd-strong': '#000000',
        ok: '#0B6B2C',
        'ok-bg': 'rgba(42,165,74,.12)',
        warn: '#6B3A00',
        'warn-bg': 'rgba(255,159,10,.14)',
        err: '#A30000',
        'err-bg': 'rgba(224,53,43,.10)',
        inf: '#0A4FB8',
        'inf-bg': 'rgba(36,112,232,.10)',
        new: '#8A4FD8',
        'new-bg': 'rgba(138,79,216,.12)',
        inv: 'rgba(30,30,34,.92)',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '6px',
        r: '10px',
        'r-l': '14px',
        'h-s': '28px',
        'h-m': '36px',
        'h-l': '44px',
        'px-s': '12px',
        'px-m': '18px',
        'px-l': '22px',
        'fs-s': '13px',
        fs: '15px',
        'fs-l': '17px',
        'sh-1': '0 0 0 1px #000000',
        'sh-2': '0 0 0 2px #000000',
        'sh-3': '0 0 0 2px #000000',
        font: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Helvetica Neue",system-ui,sans-serif',
        'ic-sw': '1.7',
        dur: '.25s',
        ease: 'cubic-bezier(.32,.72,0,1)'
      }
    },
    e: {
      light: {
        pri: '#2B5C8A',
        'pri-h': '#234D74',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E9EFF5',
        'pri-txt': '#2B5C8A',
        fg: '#1F2328',
        fg2: '#4F555D',
        fg3: '#6A7078',
        bg: '#FFFFFF',
        sunk: '#F6F7F8',
        fill: '#FFFFFF',
        'fill-h': '#F1F2F4',
        bd: '#C8CCD1',
        'bd-strong': '#6A7078',
        ok: '#1E7B45',
        'ok-bg': '#EAF6EE',
        warn: '#8C5A00',
        'warn-bg': '#FFF5DD',
        err: '#B42318',
        'err-bg': '#FDEDEB',
        inf: '#2B5C8A',
        'inf-bg': '#E9EFF5',
        new: '#5A4FB0',
        'new-bg': '#F0EEFA',
        inv: '#2A2F35',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(20,24,28,.45)',
        'r-s': '2px',
        r: '2px',
        'r-l': '4px',
        'h-s': '22px',
        'h-m': '28px',
        'h-l': '36px',
        'px-s': '6px',
        'px-m': '10px',
        'px-l': '14px',
        'fs-s': '12px',
        fs: '13px',
        'fs-l': '15px',
        'sh-1': '0 1px 2px rgba(16,24,32,.08),0 0 0 1px rgba(16,24,32,.06)',
        'sh-2': '0 6px 16px rgba(16,24,32,.12),0 0 0 1px rgba(16,24,32,.1)',
        'sh-3': '0 16px 40px rgba(16,24,32,.2),0 0 0 1px rgba(16,24,32,.12)',
        font: '"IBM Plex Sans","Segoe UI",system-ui,sans-serif',
        'ic-sw': '1.75',
        dur: '.08s',
        ease: 'linear'
      },
      dark: {
        pri: '#6A9FD6',
        'pri-h': '#82B0E0',
        'on-pri': '#0E1720',
        'pri-sub': '#1C2C3D',
        'pri-txt': '#82B0E0',
        fg: '#E3E6EA',
        fg2: '#B3B9C1',
        fg3: '#8C939C',
        bg: '#1B1F24',
        sunk: '#171A1E',
        fill: '#1B1F24',
        'fill-h': '#262B32',
        bd: '#3A414A',
        'bd-strong': '#8C939C',
        ok: '#5CC489',
        'ok-bg': '#13301F',
        warn: '#E6B455',
        'warn-bg': '#33280F',
        err: '#F08A80',
        'err-bg': '#3B1A17',
        inf: '#6A9FD6',
        'inf-bg': '#1C2C3D',
        new: '#A99CF0',
        'new-bg': '#262144',
        inv: '#E3E6EA',
        'on-inv': '#1B1F24',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '2px',
        r: '4px',
        'r-l': '8px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '6px',
        'px-m': '10px',
        'px-l': '14px',
        'fs-s': '12px',
        fs: '13px',
        'fs-l': '15px',
        'sh-1': '0 1px 2px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.06)',
        'sh-2': '0 6px 16px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08)',
        'sh-3': '0 16px 40px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.1)',
        font: '"Segoe UI Variable Text","Segoe UI","Open Sans",system-ui,sans-serif',
        'ic-sw': '1.75',
        dur: '.08s',
        ease: 'linear'
      },
      hc: {
        pri: '#173E62',
        'pri-h': '#102C46',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E0E8F2',
        'pri-txt': '#173E62',
        fg: '#000000',
        fg2: '#1A1A1A',
        fg3: '#2E2E2E',
        bg: '#FFFFFF',
        sunk: '#FFFFFF',
        fill: '#FFFFFF',
        'fill-h': '#F1F2F4',
        bd: '#000000',
        'bd-strong': '#000000',
        ok: '#0B5A0B',
        'ok-bg': '#EAF6EE',
        warn: '#6B3A00',
        'warn-bg': '#FFF5DD',
        err: '#A30000',
        'err-bg': '#FDEDEB',
        inf: '#173E62',
        'inf-bg': '#E9EFF5',
        new: '#5A4FB0',
        'new-bg': '#F0EEFA',
        inv: '#2A2F35',
        'on-inv': '#FFFFFF',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '2px',
        r: '2px',
        'r-l': '4px',
        'h-s': '22px',
        'h-m': '28px',
        'h-l': '36px',
        'px-s': '6px',
        'px-m': '10px',
        'px-l': '14px',
        'fs-s': '12px',
        fs: '13px',
        'fs-l': '15px',
        'sh-1': '0 0 0 1px #000000',
        'sh-2': '0 0 0 2px #000000',
        'sh-3': '0 0 0 2px #000000',
        font: '"IBM Plex Sans","Segoe UI",system-ui,sans-serif',
        'ic-sw': '1.75',
        dur: '.08s',
        ease: 'linear'
      }
    },
    m: {
      light: {
        pri: '#5B4BB7',
        'pri-h': '#4E3FA3',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E9E4FF',
        'pri-txt': '#5B4BB7',
        fg: '#1C1B20',
        fg2: '#49454F',
        fg3: '#6F6A78',
        bg: '#FFFFFF',
        sunk: '#F4F1F8',
        fill: '#ECE6F0',
        'fill-h': '#E3DCE8',
        bd: '#CAC4D0',
        'bd-strong': '#79747E',
        ok: '#1B7A43',
        'ok-bg': '#DDF5E6',
        warn: '#8A5300',
        'warn-bg': '#FFEFD6',
        err: '#B3261E',
        'err-bg': '#FCE8E6',
        inf: '#5B4BB7',
        'inf-bg': '#E9E4FF',
        new: '#7D5260',
        'new-bg': '#FFD9E3',
        inv: '#313033',
        'on-inv': '#F4EFF4',
        blanket: 'rgba(0,0,0,.32)',
        'r-s': '4px',
        r: '12px',
        'r-l': '16px',
        'h-s': '32px',
        'h-m': '40px',
        'h-l': '48px',
        'px-s': '12px',
        'px-m': '16px',
        'px-l': '24px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 1px 2px rgba(0,0,0,.3),0 1px 3px 1px rgba(0,0,0,.15)',
        'sh-2': '0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)',
        'sh-3': '0 4px 8px 3px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.3)',
        font: '"Roboto","Segoe UI",system-ui,sans-serif',
        'ic-sw': '1.75',
        dur: '.2s',
        ease: 'cubic-bezier(.2,0,0,1)'
      },
      dark: {
        pri: '#C8BFFF',
        'pri-h': '#D6CFFF',
        'on-pri': '#2A1F63',
        'pri-sub': '#3C3275',
        'pri-txt': '#C8BFFF',
        fg: '#E6E1E9',
        fg2: '#CAC4D0',
        fg3: '#948F99',
        bg: '#1C1B1F',
        sunk: '#141317',
        fill: '#36343B',
        'fill-h': '#403E46',
        bd: '#49454F',
        'bd-strong': '#948F99',
        ok: '#7DDB9F',
        'ok-bg': '#12351F',
        warn: '#F5C26B',
        'warn-bg': '#3A2A0F',
        err: '#F2B8B5',
        'err-bg': '#4A1512',
        inf: '#C8BFFF',
        'inf-bg': '#3C3275',
        new: '#EFB8C8',
        'new-bg': '#4A2532',
        inv: '#E6E1E9',
        'on-inv': '#313033',
        blanket: 'rgba(0,0,0,.5)',
        'r-s': '3px',
        r: '4px',
        'r-l': '6px',
        'h-s': '24px',
        'h-m': '32px',
        'h-l': '40px',
        'px-s': '12px',
        'px-m': '16px',
        'px-l': '24px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 1px 3px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04)',
        'sh-2': '0 4px 10px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06)',
        'sh-3': '0 8px 24px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08)',
        font: '"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
        'ic-sw': '1.75',
        dur: '.2s',
        ease: 'cubic-bezier(.2,0,0,1)'
      },
      hc: {
        pri: '#3A2C8C',
        'pri-h': '#2B2068',
        'on-pri': '#FFFFFF',
        'pri-sub': '#E0E8F8',
        'pri-txt': '#3A2C8C',
        fg: '#000000',
        fg2: '#1A1A1A',
        fg3: '#2E2E2E',
        bg: '#FFFFFF',
        sunk: '#FFFFFF',
        fill: '#FFFFFF',
        'fill-h': '#E6E6E6',
        bd: '#000000',
        'bd-strong': '#000000',
        ok: '#00602F',
        'ok-bg': '#DDF5E6',
        warn: '#6B3A00',
        'warn-bg': '#FFEFD6',
        err: '#A30000',
        'err-bg': '#FCE8E6',
        inf: '#3A2C8C',
        'inf-bg': '#E9E4FF',
        new: '#7D5260',
        'new-bg': '#FFD9E3',
        inv: '#313033',
        'on-inv': '#F4EFF4',
        blanket: 'rgba(0,0,0,.6)',
        'r-s': '4px',
        r: '12px',
        'r-l': '16px',
        'h-s': '32px',
        'h-m': '40px',
        'h-l': '48px',
        'px-s': '12px',
        'px-m': '16px',
        'px-l': '24px',
        'fs-s': '12px',
        fs: '14px',
        'fs-l': '16px',
        'sh-1': '0 0 0 1px #000000',
        'sh-2': '0 0 0 2px #000000',
        'sh-3': '0 0 0 2px #000000',
        font: '"Roboto","Segoe UI",system-ui,sans-serif',
        'ic-sw': '1.75',
        dur: '.2s',
        ease: 'cubic-bezier(.2,0,0,1)'
      }
    }
  };
  /* A language keeps the same structure in every theme. The lab's dark rules for Enterprise and Material fall back to Atlassian
   dimensions through a specificity quirk, so only colors and shadows are taken per theme. */
  (function () {
    var S = [
      'font',
      'r-s',
      'r',
      'r-l',
      'h-s',
      'h-m',
      'h-l',
      'px-s',
      'px-m',
      'px-l',
      'fs-s',
      'fs',
      'fs-l',
      'ic-sw',
      'dur',
      'ease'
    ];
    for (var l in LAB)
      ['dark', 'hc'].forEach(function (t) {
        S.forEach(function (k) {
          if (LAB[l].light[k] != null) LAB[l][t][k] = LAB[l].light[k];
        });
      });
  })();
  function get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function put(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  var LANGS = [
    ['kagami', 'Kagami', 'The current ERP look: orange brand, system font.'],
    ['a', 'Atlassian', 'Crisp and compact, blue, Public Sans.'],
    ['f', 'Fluent', 'Microsoft 365 feel, square-ish, Segoe UI.'],
    ['p', 'Apple', 'Soft and rounded, generous space, SF.'],
    ['e', 'Enterprise Neutral', 'Quiet slate blue, data-first, IBM Plex Sans.'],
    ['m', 'Material', 'Tonal violet, large radii, Roboto.']
  ];
  var SIZES = [
    ['xs', 'XS'],
    ['s', 'Small'],
    ['m', 'Medium'],
    ['l', 'Large'],
    ['xl', 'XL']
  ];
  var DENS = [
    ['comfortable', 'Comfortable', 'Default spacing and row height.'],
    ['compact', 'Compact', 'Tighter rows and padding.'],
    ['dense', 'Dense', 'Smallest rows, for power users.']
  ];
  var ACCENTS = [
    ['primary', 'Primary'],
    ['secondary', 'Secondary'],
    ['success', 'Success'],
    ['warning', 'Warning'],
    ['danger', 'Danger'],
    ['info', 'Info'],
    ['neutral', 'Neutral'],
    ['custom', 'Custom semantic']
  ];
  var FONTS = [
    ['lang', 'Language default', null],
    ['public', 'Public Sans', '"Public Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],
    ['plex', 'IBM Plex Sans', '"IBM Plex Sans","Segoe UI",system-ui,sans-serif'],
    ['segoe', 'Segoe UI Variable', '"Segoe UI Variable Text","Segoe UI","Open Sans",system-ui,sans-serif'],
    ['roboto', 'Roboto', '"Roboto","Segoe UI",system-ui,sans-serif'],
    ['inter', 'Inter', '"Inter",system-ui,-apple-system,"Segoe UI",sans-serif'],
    ['open', 'Open Sans', '"Open Sans","Segoe UI",system-ui,sans-serif'],
    ['instrument', 'Instrument Sans', '"Instrument Sans",system-ui,-apple-system,"Segoe UI",sans-serif'],
    [
      'sf',
      'SF Pro',
      '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Helvetica Neue",system-ui,sans-serif'
    ],
    [
      'system',
      'System UI',
      'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'
    ]
  ];
  var MONOS = [
    ['default', 'System mono', null],
    ['jb', 'JetBrains Mono', '"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace']
  ];
  var RADII = [
    ['lang', 'Language default'],
    ['sharp', 'Sharp'],
    ['soft', 'Soft'],
    ['round', 'Round']
  ];
  var ELEVS = [
    ['lang', 'Language default'],
    ['flat', 'Flat'],
    ['raised', 'Raised']
  ];
  var MOTIONS = [
    ['lang', 'Language default'],
    ['reduced', 'Reduced'],
    ['off', 'Off']
  ];
  var ICONS = [
    ['lang', 'Language default'],
    ['light', 'Light 1.25'],
    ['regular', 'Regular 1.75'],
    ['bold', 'Bold 2.25']
  ];
  var FORMS = [
    ['stack', 'Stacked', 'All sections on one page.'],
    ['accordion', 'Accordion', 'Collapsible sections, open what you need.'],
    ['tabs', 'Tabs', 'One section at a time.'],
    ['side', 'Side navigation', 'Nested panel with the section list on the left.'],
    ['steps', 'Steps', 'Guided, with Back and Next.']
  ];
  var FITS = [
    ['on', 'Fit to screen', 'No page scrolling, sections scroll inside.'],
    ['off', 'Scroll normally', 'Original page flow.']
  ];
  /* ---- independent navbar: colors, background, nested + hover colors, font, size ---- */
  var NAVCOLORS = [
    'bg',
    'bg2',
    'text',
    'hover',
    'hoverText',
    'active',
    'activeText',
    'border',
    'subBg',
    'subText',
    'subHover',
    'subHoverText',
    'subActive',
    'subActiveText',
    'subLine',
    'icon',
    'iconHover',
    'iconActive'
  ];
  var NAVSUBS = [
    ['tint', 'Soft tint', 'Hover fills the item with the nested hover color.'],
    ['fill', 'Accent fill', 'Hover uses the active colors.'],
    ['bar', 'Side bar', 'A thin line appears on the left.'],
    ['underline', 'Underline', 'A thin line appears underneath.'],
    ['indent', 'Indent', 'The item nudges to the right.']
  ];
  var NAVDEF = { preset: 'default', bgmode: 'solid', angle: 135, font: 'lang', size: 0, subVariant: 'tint' };
  NAVCOLORS.forEach(function (f) {
    NAVDEF[f] = '';
  });
  var NAVPRESETS = [
    ['default', 'Default', 'Follows the light and dark theme', {}],
    [
      'midnight',
      'Midnight',
      'Dark slate',
      {
        bg: '#12161C',
        text: '#A9B2C0',
        hover: '#1E2530',
        hoverText: '#FFFFFF',
        active: '#2B3647',
        activeText: '#FFFFFF',
        border: '#242B35',
        subText: '#8A94A6',
        subHover: '#1A212B',
        subHoverText: '#FFFFFF',
        subActive: '#2B3647',
        subActiveText: '#FFFFFF',
        subLine: '#2F3948'
      }
    ],
    ['ocean', 'Ocean', 'Teal gradient', { bgmode: 'gradient', bg: '#0B4F6C', bg2: '#1B7F9E', angle: 160 }],
    [
      'sunset',
      'Sunset',
      'Berry to orange',
      { bgmode: 'gradient', bg: '#B4235A', bg2: '#F26522', angle: 160 }
    ],
    ['forest', 'Forest', 'Deep green', { bg: '#14532D' }],
    ['plum', 'Plum', 'Deep violet', { bg: '#4C1D95' }],
    [
      'slate',
      'Slate',
      'Light cool gray',
      {
        bg: '#F1F5F9',
        text: '#475569',
        hover: '#E2E8F0',
        hoverText: '#0F172A',
        active: '#FFFFFF',
        activeText: '#0F172A',
        border: '#E2E8F0'
      }
    ],
    [
      'sand',
      'Sand',
      'Warm paper',
      {
        bg: '#FAF5EC',
        text: '#6B5B45',
        hover: '#F0E7D6',
        hoverText: '#3D3224',
        active: '#FFFFFF',
        activeText: '#3D3224',
        border: '#EADFC8'
      }
    ],
    [
      'contrast',
      'Contrast',
      'Black and yellow',
      {
        bg: '#000000',
        text: '#FFFFFF',
        hover: '#262626',
        hoverText: '#FFFFFF',
        active: '#FFD400',
        activeText: '#000000',
        border: '#FFFFFF',
        subLine: '#FFFFFF'
      }
    ]
  ];
  function hexOk(v) {
    return v === '' || /^#[0-9a-f]{6}$/i.test(String(v));
  }
  function cleanNav(o) {
    var c = {},
      s = o && typeof o === 'object' ? o : {};
    for (var k in NAVDEF) c[k] = NAVDEF[k];
    NAVCOLORS.forEach(function (f) {
      if (typeof s[f] === 'string' && hexOk(s[f])) c[f] = s[f].toUpperCase();
    });
    if (
      NAVPRESETS.some(function (p) {
        return p[0] === s.preset;
      }) ||
      s.preset === 'custom'
    )
      c.preset = s.preset;
    if (s.bgmode === 'solid' || s.bgmode === 'gradient') c.bgmode = s.bgmode;
    if (+s.angle >= 0 && +s.angle <= 360) c.angle = Math.round(+s.angle);
    if (
      FONTS.some(function (f) {
        return f[0] === s.font;
      })
    )
      c.font = s.font;
    if (+s.size === 0 || (+s.size >= 11 && +s.size <= 18)) c.size = +s.size || 0;
    if (
      NAVSUBS.some(function (x) {
        return x[0] === s.subVariant;
      })
    )
      c.subVariant = s.subVariant;
    return c;
  }
  function lumHex(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c);
    if (!m) return 0;
    var n = parseInt(m[1], 16),
      r = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2];
  }
  function navVars() {
    var c = st.navcfg,
      o = {},
      d = {},
      has = !!c.bg,
      fg = null,
      mixf = null;
    if (has) {
      fg = lumHex(c.bg) < 0.4 ? '#FFFFFF' : '#111827';
      mixf = function (p) {
        return 'color-mix(in srgb,' + fg + ' ' + p + '%,transparent)';
      };
      d = {
        text: mixf(80),
        hover: mixf(13),
        hoverText: fg,
        active: mixf(22),
        activeText: fg,
        border: mixf(16),
        subLine: mixf(18)
      };
      o['--nv-card'] = mixf(9);
    }
    var bg = has
      ? c.bgmode === 'gradient' && c.bg2
        ? 'linear-gradient(' + c.angle + 'deg,' + c.bg + ',' + c.bg2 + ')'
        : c.bg
      : '';
    if (bg) o['--nv-bg'] = bg;
    var M = {
      text: '--nv-text',
      hover: '--nv-hover',
      hoverText: '--nv-hover-text',
      active: '--nv-active',
      activeText: '--nv-active-text',
      border: '--nv-border',
      subBg: '--nv-sub-bg',
      subText: '--nv-sub-text',
      subHover: '--nv-sub-hover',
      subHoverText: '--nv-sub-hover-text',
      subActive: '--nv-sub-active',
      subActiveText: '--nv-sub-active-text',
      subLine: '--nv-sub-line',
      icon: '--nv-icon',
      iconHover: '--nv-icon-h',
      iconActive: '--nv-icon-a'
    };
    var custom = has || !!(c.text || c.hover || c.hoverText || c.active || c.activeText);
    if (custom) {
      o['--nv-icon'] = 'currentColor';
      o['--nv-icon-h'] = 'currentColor';
      o['--nv-icon-a'] = 'currentColor';
    }
    for (var f in M) {
      var v = c[f] || d[f];
      if (v) o[M[f]] = v;
    }
    var bar = c.subActiveText || c.activeText || fg;
    if (bar) o['--nv-sub-bar'] = bar;
    var ft = FONTS.filter(function (x) {
      return x[0] === c.font;
    })[0];
    if (ft && ft[2]) o['--nv-font'] = ft[2];
    if (c.size) o['--nv-fs'] = c.size + 'px';
    return o;
  }
  function setNav(p) {
    st.navcfg = cleanNav(Object.assign({}, st.navcfg, p));
    if (p && !p.preset) st.navcfg.preset = 'custom';
    save();
    apply();
    notify();
  }
  function navPreset(id) {
    var pr = NAVPRESETS.filter(function (x) {
      return x[0] === id;
    })[0];
    if (!pr) return;
    var keep = { font: st.navcfg.font, size: st.navcfg.size, subVariant: st.navcfg.subVariant };
    st.navcfg = cleanNav(Object.assign({}, NAVDEF, keep, pr[3], { preset: id }));
    save();
    apply();
    notify();
  }
  var ICON_SW = { light: '1.25', regular: '1.75', bold: '2.25' };
  var RADIUS = { sharp: [0, 0, 0, 2], soft: [6, 8, 12, 14], round: [10, 12, 18, 22] };
  var DEF = {
    lang: 'kagami',
    size: 'm',
    color: 'language',
    accent: 'primary',
    font: 'lang',
    mono: 'default',
    radius: 'lang',
    elev: 'lang',
    motion: 'lang',
    icons: 'lang',
    forms: 'tabs',
    fit: 'on'
  };
  var OPT = {
    lang: LANGS,
    size: SIZES,
    color: [['language'], ['brand']],
    accent: ACCENTS,
    font: FONTS,
    mono: MONOS,
    radius: RADII,
    elev: ELEVS,
    motion: MOTIONS,
    icons: ICONS,
    forms: FORMS,
    fit: FITS
  };
  var KM = {
    'h-s': 30,
    'h-m': 36,
    'h-l': 42,
    'fs-s': 13,
    fs: 14,
    'fs-l': 16,
    'px-s': 10,
    'px-m': 14,
    'px-l': 18,
    'r-s': 4,
    r: 6,
    'r-l': 8
  };
  /* Kagami has no lab palette: its high-contrast set is defined here, light and dark come from the app itself */
  var KHC = {
    '--bg': '#FFFFFF',
    '--surface': '#FFFFFF',
    '--surface-secondary': '#F2F2F2',
    '--surface-hover': '#E6E6E6',
    '--surface-sunken': '#F7F7F7',
    '--text': '#000000',
    '--text-muted': '#1F1F1F',
    '--text-subtle': '#404040',
    '--border': '#000000',
    '--border-strong': '#000000',
    '--success': '#0B5A0B',
    '--success-soft': '#EAF6EE',
    '--success-text': '#0B5A0B',
    '--warning-soft': '#FFF5DD',
    '--warning-text': '#6B3A00',
    '--danger': '#A30000',
    '--danger-soft': '#FDEDEB',
    '--danger-text': '#A30000',
    '--purple-text': '#4B3A9E',
    '--neutral-text': '#1F1F1F',
    '--primary-text': '#8A2F05',
    '--focus': '0 0 0 3px #000000',
    '--shadow-sm': '0 0 0 1px #000000',
    '--shadow-md': '0 0 0 2px #000000',
    '--shadow-lg': '0 0 0 2px #000000'
  };
  var KCARD = {
    light: {
      bg: '#FFFFFF',
      fg: '#172033',
      fg2: '#667085',
      bd: '#E4E7EC',
      pri: '#F26522',
      on: '#FFFFFF',
      sub: '#FEF0E8',
      fill: '#F2F4F7',
      r: 6
    },
    dark: {
      bg: '#171B21',
      fg: '#F5F7FA',
      fg2: '#98A2B3',
      bd: '#2A3038',
      pri: '#F26522',
      on: '#FFFFFF',
      sub: '#3A2217',
      fill: '#1E232B',
      r: 6
    },
    hc: {
      bg: '#FFFFFF',
      fg: '#000000',
      fg2: '#1F1F1F',
      bd: '#000000',
      pri: '#C2410C',
      on: '#FFFFFF',
      sub: '#FFEDE0',
      fill: '#F2F2F2',
      r: 6
    }
  };
  var KFONT =
    'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var st = {},
    subs = [];
  (function load() {
    var s = {};
    try {
      s = JSON.parse(get('kagami-lab') || '{}') || {};
    } catch (e) {}
    for (var k in DEF) {
      var v = s[k];
      st[k] = OPT[k].some(function (o) {
        return o[0] === v;
      })
        ? v
        : DEF[k];
    }
    st.navcfg = cleanNav(s.navcfg);
  })();
  function px(v) {
    return parseFloat(v);
  }
  function css(o) {
    var s = '';
    for (var k in o) if (o[k] != null && o[k] !== '') s += k + ':' + o[k] + ';';
    return s;
  }
  function mx(c) {
    return 'color-mix(in srgb,' + c + ' 85%,#000)';
  }
  function metrics(lang) {
    return lang === 'kagami' ? KM : LAB[lang].light;
  }
  function sizeInfo(lang, size) {
    var m = metrics(lang),
      n = function (k) {
        return px(m[k]);
      };
    var S = {
      xs: [24, 12, 8],
      s: [n('h-s'), n('fs-s'), n('px-s')],
      m: [n('h-m'), n('fs'), n('px-m')],
      l: [n('h-l'), n('fs-l'), n('px-l')],
      xl: [n('h-l') + 8, n('fs-l') + 2, n('px-l') + 6]
    }[size] || [36, 14, 14];
    return { h: S[0], fs: S[1], px: S[2] };
  }
  function themeKey() {
    var t = D.getAttribute('data-theme');
    return t === 'dark' || t === 'hc' ? t : 'light';
  }
  function effColor() {
    return st.lang === 'kagami' ? 'brand' : st.color;
  }
  function roleColors(t, role) {
    var m = {
      primary: [t.pri, t['pri-h'], t['pri-sub'], t['pri-txt'], t['on-pri']],
      secondary: [t.fg2, t.fg, t.fill, t.fg2, t.bg],
      success: [t.ok, mx(t.ok), t['ok-bg'], t.ok, '#FFFFFF'],
      warning: [t.warn, mx(t.warn), t['warn-bg'], t.warn, '#FFFFFF'],
      danger: [t.err, mx(t.err), t['err-bg'], t.err, '#FFFFFF'],
      info: [t.inf, mx(t.inf), t['inf-bg'], t.inf, t['on-pri']],
      neutral: [t.inv, mx(t.inv), t.fill, t.fg, t['on-inv']],
      custom: [t.new, mx(t.new), t['new-bg'], t.new, '#FFFFFF']
    };
    return m[role] || m.primary;
  }
  function roleColor(lang, theme, role) {
    return lang === 'kagami' ? KCARD[theme].pri : roleColors(LAB[lang][theme], role)[0];
  }
  function tokenBlock(lang, th) {
    var t = LAB[lang][th],
      o = {};
    o['--bg'] = t.sunk;
    o['--surface'] = t.bg;
    o['--surface-secondary'] = t.fill;
    o['--surface-hover'] = t['fill-h'];
    o['--surface-sunken'] = t.sunk;
    o['--text'] = t.fg;
    o['--text-muted'] = t.fg2;
    o['--text-subtle'] = t.fg3;
    o['--border'] = t.bd;
    o['--border-strong'] = t['bd-strong'];
    o['--success'] = t.ok;
    o['--success-soft'] = t['ok-bg'];
    o['--success-text'] = t.ok;
    o['--warning-soft'] = t['warn-bg'];
    o['--warning-text'] = t.warn;
    o['--danger'] = t.err;
    o['--danger-soft'] = t['err-bg'];
    o['--danger-text'] = t.err;
    o['--purple'] = t.new;
    o['--purple-soft'] = t['new-bg'];
    o['--purple-text'] = t.new;
    o['--neutral-soft'] = t.fill;
    o['--neutral-text'] = t.fg2;
    o['--shadow-sm'] = t['sh-1'];
    o['--shadow-md'] = t['sh-2'];
    o['--shadow-lg'] = t['sh-3'];
    o['--overlay'] = t.blanket;
    o['--r-sm'] = t['r-s'];
    o['--r'] = t.r;
    o['--r-md'] = t['r-l'];
    o['--r-lg'] = px(t['r-l']) + 2 + 'px';
    o['--c2'] = t.ok;
    o['--c3'] = t.warn;
    o['--c4'] = t.new;
    o['--c5'] = t.inf;
    o['--c6'] = t['pri-h'];
    o['--font'] = t.font;
    o['--ic-sw'] = t['ic-sw'];
    o['--lab-dur'] = t.dur;
    o['--lab-ease'] = t.ease;
    if (effColor() === 'language') {
      var r = roleColors(t, st.accent),
        p = r[0];
      o['--primary'] = p;
      o['--primary-hover'] = r[1];
      o['--primary-soft'] = r[2];
      o['--primary-text'] = r[3];
      o['--on-primary'] = r[4];
      o['--focus'] =
        '0 0 0 3px color-mix(in srgb,' + p + ' ' + (th === 'hc' ? '100' : '35') + '%,transparent)';
      o['--c1'] = p;
      o['--grad-a'] = p;
      o['--grad-b'] = p;
      o['--primary-grad'] = 'linear-gradient(' + p + ',' + p + ')';
      o['--primary-hover-grad'] = 'linear-gradient(' + r[1] + ',' + r[1] + ')';
    }
    return o;
  }
  function userBlock() {
    var o = {},
      s = sizeInfo(st.lang, st.size);
    o['--ctl-h'] = s.h + 'px';
    o['--ui-fs'] = s.fs + 'px';
    o['--ctl-px'] = s.px + 'px';
    var m = metrics(st.lang),
      rd = null;
    if (st.radius !== 'lang') rd = RADIUS[st.radius];
    else if (st.lang !== 'kagami') rd = [px(m['r-s']), px(m.r), px(m['r-l']), px(m['r-l']) + 2];
    if (rd) {
      o['--r-sm'] = rd[0] + 'px';
      o['--r'] = rd[1] + 'px';
      o['--r-md'] = rd[2] + 'px';
      o['--r-lg'] = rd[3] + 'px';
    }
    if (st.elev === 'flat') {
      o['--shadow-sm'] = 'none';
      o['--shadow-md'] = '0 0 0 1px var(--border)';
      o['--shadow-lg'] = '0 0 0 1px var(--border-strong)';
    } else if (st.elev === 'raised') {
      o['--shadow-sm'] = '0 1px 3px rgba(0,0,0,.18)';
      o['--shadow-md'] = '0 8px 20px -4px rgba(0,0,0,.22)';
      o['--shadow-lg'] = '0 32px 64px -12px rgba(0,0,0,.45)';
    }
    var f = FONTS.filter(function (x) {
      return x[0] === st.font;
    })[0];
    if (f && f[2]) o['--font'] = f[2];
    var mo = MONOS.filter(function (x) {
      return x[0] === st.mono;
    })[0];
    if (mo && mo[2]) o['--mono'] = mo[2];
    if (st.icons !== 'lang') o['--ic-sw'] = ICON_SW[st.icons];
    else if (st.lang === 'kagami') o['--ic-sw'] = '1.75';
    if (st.motion === 'reduced') o['--lab-dur'] = '.06s';
    else if (st.lang === 'kagami' && st.motion === 'lang') {
      o['--lab-dur'] = '.12s';
      o['--lab-ease'] = 'ease';
    }
    return o;
  }
  function apply() {
    var h = '',
      th;
    if (st.lang !== 'kagami') {
      ['light', 'dark', 'hc'].forEach(function (t) {
        h += 'html:root[data-theme="' + t + '"]{' + css(tokenBlock(st.lang, t)) + '}';
      });
    } else h += 'html:root[data-theme="hc"]{' + css(KHC) + '}';
    h += 'html:root:root{' + css(userBlock()) + css(navVars()) + '}';
    var el = document.getElementById('kagami-lab');
    if (!el) {
      el = document.createElement('style');
      el.id = 'kagami-lab';
      document.head.appendChild(el);
    }
    el.textContent = h;
    D.setAttribute('data-lang', st.lang);
    D.setAttribute('data-size', st.size);
    D.setAttribute('data-motion', st.motion);
    D.setAttribute('data-navsub', st.navcfg.subVariant);
    D.setAttribute('data-accent', effColor() === 'language' ? st.accent : 'brand');
  }
  function save() {
    put('kagami-lab', JSON.stringify(st));
  }
  function notify() {
    subs.forEach(function (f) {
      try {
        f(st);
      } catch (e) {}
    });
  }
  function set(k, v) {
    if (
      !(k in DEF) ||
      !OPT[k].some(function (o) {
        return o[0] === v;
      })
    )
      return;
    st[k] = v;
    save();
    apply();
    notify();
  }
  function reset() {
    for (var k in DEF) st[k] = DEF[k];
    st.navcfg = cleanNav(null);
    save();
    apply();
    notify();
  }
  function cardTokens(id, th) {
    if (id === 'kagami') {
      var k = KCARD[th];
      return {
        bg: k.bg,
        fg: k.fg,
        fg2: k.fg2,
        bd: k.bd,
        pri: k.pri,
        on: k.on,
        sub: k.sub,
        fill: k.fill,
        r: k.r + 'px',
        font: KFONT
      };
    }
    var t = LAB[id][th];
    return {
      bg: t.bg,
      fg: t.fg,
      fg2: t.fg2,
      bd: t.bd,
      pri: t.pri,
      on: t['on-pri'],
      sub: t['pri-sub'],
      fill: t.fill,
      r: t.r,
      font: t.font
    };
  }
  function langFont(id) {
    return id === 'kagami' ? KFONT : LAB[id].light.font;
  }
  window.KagamiLab = {
    state: st,
    set: set,
    reset: reset,
    apply: apply,
    subscribe: function (f) {
      subs.push(f);
    },
    LANGS: LANGS,
    SIZES: SIZES,
    DENS: DENS,
    ACCENTS: ACCENTS,
    FONTS: FONTS,
    MONOS: MONOS,
    RADII: RADII,
    ELEVS: ELEVS,
    MOTIONS: MOTIONS,
    ICONS: ICONS,
    FORMS: FORMS,
    FITS: FITS,
    NAV: {
      COLORS: NAVCOLORS,
      PRESETS: NAVPRESETS,
      SUBS: NAVSUBS,
      DEF: NAVDEF,
      set: setNav,
      preset: navPreset
    },
    DEF: DEF,
    sizeInfo: sizeInfo,
    roleColor: roleColor,
    cardTokens: cardTokens,
    langFont: langFont,
    effColor: effColor,
    themeKey: themeKey
  };
  apply();
})();
