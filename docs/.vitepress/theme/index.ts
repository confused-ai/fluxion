import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import './style.css';

import AnnouncementBanner from './components/AnnouncementBanner.vue';
import HeroStats from './components/HeroStats.vue';
import CodeDemo from './components/CodeDemo.vue';
import HonoCards from './components/HonoCards.vue';
import DelightfulDX from './components/DelightfulDX.vue';
import BatteriesIncluded from './components/BatteriesIncluded.vue';
import ComparisonSection from './components/ComparisonSection.vue';
import EnterpriseSection from './components/EnterpriseSection.vue';
import ProvidersGrid from './components/ProvidersGrid.vue';
import CtaBanner from './components/CtaBanner.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-before': () => h(AnnouncementBanner),
      'home-hero-after': () => h(HeroStats),
      'home-features-after': () =>
        h('div', { class: 'ca-landing-sections' }, [
          h(HonoCards),
          h(CodeDemo),
          h(DelightfulDX),
          h(BatteriesIncluded),
          h(ComparisonSection),
          h(EnterpriseSection),
          h(ProvidersGrid),
          h(CtaBanner),
        ]),
    });
  },
};
