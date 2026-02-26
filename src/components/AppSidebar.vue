<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import {
    Command,
    Package,
    ShoppingCart,
} from "lucide-vue-next"
import NavMain from '@/components/NavMain.vue'

import {
    Sidebar,
    SidebarContent,
    SidebarRail,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
    collapsible: "icon",
})

const data = {
    user: {
        name: "Admin",
        email: "admin@example.com",
        avatar: "https://github.com/shadcn.png",
    },
    teams: [
        {
            name: "Dashboard Pro",
            logo: Command,
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: "商品管理",
            url: "/product-manage",
            icon: Package,
        },
        {
            title: "購物車折扣",
            url: "/cart-discount",
            icon: ShoppingCart,
        },
    ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarContent>
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
