import { createRouter, createWebHashHistory } from 'vue-router'
import FixedLengthConverter from '../views/FixedLengthConverter.vue'
import NumberingLineConverter from '../views/NumberingLineConverter.vue'
import SqlInsertGenerator from '../views/SqlInsertGenerator.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/fixed-length'
    },
    {
      path: '/fixed-length',
      name: 'fixed-length',
      component: FixedLengthConverter
    },
    {
      path: '/numbering-line',
      name: 'numbering-line',
      component: NumberingLineConverter
    },
    {
      path: '/sql-insert',
      name: 'sql-insert',
      component: SqlInsertGenerator
    }
  ]
})

export default router
