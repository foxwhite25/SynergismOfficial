import { prod } from '../Config'
import { changeSubTab, getActiveSubTab, Tabs } from '../Tabs'
import { assert, createDeferredPromise, type DeferredPromise, memoize, retry } from '../Utility'
import { setEmptyProductMap } from './CartUtil'
import { clearCheckoutTab, toggleCheckoutTab } from './CheckoutTab'
import { clearConsumablesTab, toggleConsumablesTab } from './ConsumablesTab'
import { clearMerchSubtab, toggleMerchSubtab } from './MerchTab'
import { clearProductPage, toggleProductPage } from './ProductSubtab'
import { clearSubscriptionPage, toggleSubscriptionPage } from './SubscriptionsSubtab'
import { clearUpgradeSubtab, toggleUpgradeSubtab, type UpgradesResponse } from './UpgradesSubtab'

interface BaseProduct {
  name: string
  id: string
  price: number
  coins: number
  description: string
  features: string[]
}

export interface SubscriptionProduct extends BaseProduct {
  subscription: true
  quarkBonus: number
  tier: number
}

export interface RegularProduct extends BaseProduct {
  subscription: false
}

export type Product = SubscriptionProduct | RegularProduct

export const products: Product[] = []
export let coinProducts: RegularProduct[] = []
export let subscriptionProducts: SubscriptionProduct[] = []
export let upgradeResponse: UpgradesResponse

const cartSubTabs = {
  Coins: 0,
  Subscriptions: 1,
  Upgrades: 2,
  Consumables: 3,
  Checkout: 4,
  Merch: 5
} as const

const tab = document.getElementById('pseudoCoins')!

function* yieldQuerySelectorAll (selector: string) {
  const elements = tab.querySelectorAll(selector)

  for (let i = 0; i < elements.length; i++) {
    yield [i, elements.item(i)] as const
  }
}

export class CartTab {
  static #productsFetch: DeferredPromise<undefined> | undefined
  static #upgradesFetch: DeferredPromise<UpgradesResponse> | undefined

  constructor () {
    this.#updateSubtabs()
  }

  static fetchProducts () {
    if (CartTab.#productsFetch) {
      return CartTab.#productsFetch.promise
    }

    CartTab.#productsFetch = createDeferredPromise()

    const url = !prod ? 'https://synergism.cc/stripe/test/products' : 'https://synergism.cc/stripe/products'

    // TODO: move this fetch to the products page.
    fetch(url)
      .then((response) => response.json())
      .then((productsList: Product[]) => {
        products.push(...productsList)
        setEmptyProductMap(productsList)
        coinProducts = products.filter((product): product is RegularProduct => !product.subscription)
        subscriptionProducts = products.filter((product): product is SubscriptionProduct => product.subscription)

        // The Subscriptions do not naturally sort themselves by price
        subscriptionProducts.sort((a, b) => a.price - b.price)
        CartTab.#productsFetch?.resolve(undefined)
      })
      .catch((e) => CartTab.#productsFetch!.reject(e))

    return CartTab.#productsFetch.promise
  }

  static fetchUpgrades () {
    if (CartTab.#upgradesFetch) {
      return CartTab.#upgradesFetch.promise
    }

    CartTab.#upgradesFetch = createDeferredPromise()

    const url = 'https://synergism.cc/stripe/upgrades'

    // TODO: move this fetch to the products page.
    retry(5, async () => {
      const response = await fetch(url)
      assert(response.ok, `received status ${response.status}`) // internal server error
      return response
    }, { backoff: 'exponential', maxDelay: 30_000 })
      .then((response) => response.json())
      .then((_: UpgradesResponse) => {
        const upgrade = <UpgradesResponse>{"coins":0,"upgrades":[{"upgradeId":1,"maxLevel":1,"name":"Instant Unlock","description":"Instantly unlocks the Plastic Talisman in the shop! (Applies to all savefiles)","internalName":"INSTANT_UNLOCK_1","level":1,"cost":400},{"upgradeId":2,"maxLevel":1,"name":"Instant Unlock","description":"Instantly unlock the Infinite Ascent rune in the shop! (Applies to all savefiles)","internalName":"INSTANT_UNLOCK_2","level":1,"cost":600},{"upgradeId":3,"maxLevel":5,"name":"Multi-Level","description":"Receive +6% Cubes per level","internalName":"CUBE_BUFF","level":1,"cost":100},{"upgradeId":3,"maxLevel":5,"name":"Multi-Level","description":"Receive +6% Cubes per level","internalName":"CUBE_BUFF","level":2,"cost":150},{"upgradeId":3,"maxLevel":5,"name":"Multi-Level","description":"Receive +6% Cubes per level","internalName":"CUBE_BUFF","level":3,"cost":200},{"upgradeId":3,"maxLevel":5,"name":"Multi-Level","description":"Receive +6% Cubes per level","internalName":"CUBE_BUFF","level":4,"cost":250},{"upgradeId":3,"maxLevel":5,"name":"Multi-Level","description":"Receive +6% Cubes per level","internalName":"CUBE_BUFF","level":5,"cost":300},{"upgradeId":4,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Ambrosia Luck per level","internalName":"AMBROSIA_LUCK_BUFF","level":1,"cost":100},{"upgradeId":4,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Ambrosia Luck per level","internalName":"AMBROSIA_LUCK_BUFF","level":2,"cost":150},{"upgradeId":4,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Ambrosia Luck per level","internalName":"AMBROSIA_LUCK_BUFF","level":3,"cost":200},{"upgradeId":4,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Ambrosia Luck per level","internalName":"AMBROSIA_LUCK_BUFF","level":4,"cost":250},{"upgradeId":4,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Ambrosia Luck per level","internalName":"AMBROSIA_LUCK_BUFF","level":5,"cost":300},{"upgradeId":5,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% Ambrosia Generation Speed per level","internalName":"AMBROSIA_GENERATION_BUFF","level":1,"cost":100},{"upgradeId":5,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% Ambrosia Generation Speed per level","internalName":"AMBROSIA_GENERATION_BUFF","level":2,"cost":150},{"upgradeId":5,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% Ambrosia Generation Speed per level","internalName":"AMBROSIA_GENERATION_BUFF","level":3,"cost":200},{"upgradeId":5,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% Ambrosia Generation Speed per level","internalName":"AMBROSIA_GENERATION_BUFF","level":4,"cost":250},{"upgradeId":5,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% Ambrosia Generation Speed per level","internalName":"AMBROSIA_GENERATION_BUFF","level":5,"cost":300},{"upgradeId":8,"maxLevel":5,"name":"Multi-Level","description":"Receive +4% Golden Quarks per level","internalName":"GOLDEN_QUARK_BUFF","level":1,"cost":100},{"upgradeId":8,"maxLevel":5,"name":"Multi-Level","description":"Receive +4% Golden Quarks per level","internalName":"GOLDEN_QUARK_BUFF","level":2,"cost":150},{"upgradeId":8,"maxLevel":5,"name":"Multi-Level","description":"Receive +4% Golden Quarks per level","internalName":"GOLDEN_QUARK_BUFF","level":3,"cost":200},{"upgradeId":8,"maxLevel":5,"name":"Multi-Level","description":"Receive +4% Golden Quarks per level","internalName":"GOLDEN_QUARK_BUFF","level":4,"cost":250},{"upgradeId":8,"maxLevel":5,"name":"Multi-Level","description":"Receive +4% Golden Quarks per level","internalName":"GOLDEN_QUARK_BUFF","level":5,"cost":300},{"upgradeId":9,"maxLevel":5,"name":"Multi-Level","description":"Receive +2% more Free Upgrades from promocodes per level","internalName":"FREE_UPGRADE_PROMOCODE_BUFF","level":1,"cost":100},{"upgradeId":9,"maxLevel":5,"name":"Multi-Level","description":"Receive +2% more Free Upgrades from promocodes per level","internalName":"FREE_UPGRADE_PROMOCODE_BUFF","level":2,"cost":150},{"upgradeId":9,"maxLevel":5,"name":"Multi-Level","description":"Receive +2% more Free Upgrades from promocodes per level","internalName":"FREE_UPGRADE_PROMOCODE_BUFF","level":3,"cost":200},{"upgradeId":9,"maxLevel":5,"name":"Multi-Level","description":"Receive +2% more Free Upgrades from promocodes per level","internalName":"FREE_UPGRADE_PROMOCODE_BUFF","level":4,"cost":250},{"upgradeId":9,"maxLevel":5,"name":"Multi-Level","description":"Receive +2% more Free Upgrades from promocodes per level","internalName":"FREE_UPGRADE_PROMOCODE_BUFF","level":5,"cost":300},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":1,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":2,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":3,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":4,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":5,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":6,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":7,"cost":125},{"upgradeId":10,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Corruption Loadout slot!","internalName":"CORRUPTION_LOADOUT_SLOT_QOL","level":8,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":1,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":2,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":3,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":4,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":5,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":6,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":7,"cost":125},{"upgradeId":11,"maxLevel":8,"name":"QOL","description":"Each purchase adds +1 Ambrosia Loadout slot!","internalName":"AMBROSIA_LOADOUT_SLOT_QOL","level":8,"cost":125},{"upgradeId":12,"maxLevel":1,"name":"QOL","description":"Auto-Potion No Longer Spends Potions When Consumed!","internalName":"AUTO_POTION_FREE_POTIONS_QOL","level":1,"cost":500},{"upgradeId":13,"maxLevel":2,"name":"QOL","description":"Increase the Offline Timer Cap by 100% per level!","internalName":"OFFLINE_TIMER_CAP_BUFF","level":1,"cost":400},{"upgradeId":13,"maxLevel":2,"name":"QOL","description":"Increase the Offline Timer Cap by 100% per level!","internalName":"OFFLINE_TIMER_CAP_BUFF","level":2,"cost":600},{"upgradeId":15,"maxLevel":2,"name":"QOL","description":"Increase \"add\" Code Cap by 100% per level!","internalName":"ADD_CODE_CAP_BUFF","level":1,"cost":400},{"upgradeId":15,"maxLevel":2,"name":"QOL","description":"Increase \"add\" Code Cap by 100% per level!","internalName":"ADD_CODE_CAP_BUFF","level":2,"cost":600},{"upgradeId":17,"maxLevel":5,"name":"Multi-Level","description":"Receive +6 Base Offerings per level, affected by all multipliers!","internalName":"BASE_OFFERING_BUFF","level":1,"cost":100},{"upgradeId":17,"maxLevel":5,"name":"Multi-Level","description":"Receive +6 Base Offerings per level, affected by all multipliers!","internalName":"BASE_OFFERING_BUFF","level":2,"cost":150},{"upgradeId":17,"maxLevel":5,"name":"Multi-Level","description":"Receive +6 Base Offerings per level, affected by all multipliers!","internalName":"BASE_OFFERING_BUFF","level":3,"cost":200},{"upgradeId":17,"maxLevel":5,"name":"Multi-Level","description":"Receive +6 Base Offerings per level, affected by all multipliers!","internalName":"BASE_OFFERING_BUFF","level":4,"cost":250},{"upgradeId":17,"maxLevel":5,"name":"Multi-Level","description":"Receive +6 Base Offerings per level, affected by all multipliers!","internalName":"BASE_OFFERING_BUFF","level":5,"cost":300},{"upgradeId":18,"maxLevel":5,"name":"Multi-Level","description":"Receive +3 Base Obtainium per level, affected by all multipliers!","internalName":"BASE_OBTAINIUM_BUFF","level":1,"cost":100},{"upgradeId":18,"maxLevel":5,"name":"Multi-Level","description":"Receive +3 Base Obtainium per level, affected by all multipliers!","internalName":"BASE_OBTAINIUM_BUFF","level":2,"cost":150},{"upgradeId":18,"maxLevel":5,"name":"Multi-Level","description":"Receive +3 Base Obtainium per level, affected by all multipliers!","internalName":"BASE_OBTAINIUM_BUFF","level":3,"cost":200},{"upgradeId":18,"maxLevel":5,"name":"Multi-Level","description":"Receive +3 Base Obtainium per level, affected by all multipliers!","internalName":"BASE_OBTAINIUM_BUFF","level":4,"cost":250},{"upgradeId":18,"maxLevel":5,"name":"Multi-Level","description":"Receive +3 Base Obtainium per level, affected by all multipliers!","internalName":"BASE_OBTAINIUM_BUFF","level":5,"cost":300},{"upgradeId":19,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Red Ambrosia Luck per level","internalName":"RED_LUCK_BUFF","level":1,"cost":100},{"upgradeId":19,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Red Ambrosia Luck per level","internalName":"RED_LUCK_BUFF","level":2,"cost":150},{"upgradeId":19,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Red Ambrosia Luck per level","internalName":"RED_LUCK_BUFF","level":3,"cost":200},{"upgradeId":19,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Red Ambrosia Luck per level","internalName":"RED_LUCK_BUFF","level":4,"cost":250},{"upgradeId":19,"maxLevel":5,"name":"Multi-Level","description":"Receive +20 Red Ambrosia Luck per level","internalName":"RED_LUCK_BUFF","level":5,"cost":300},{"upgradeId":20,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% more Red Ambrosia Bar Points per level","internalName":"RED_GENERATION_BUFF","level":1,"cost":100},{"upgradeId":20,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% more Red Ambrosia Bar Points per level","internalName":"RED_GENERATION_BUFF","level":2,"cost":150},{"upgradeId":20,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% more Red Ambrosia Bar Points per level","internalName":"RED_GENERATION_BUFF","level":3,"cost":200},{"upgradeId":20,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% more Red Ambrosia Bar Points per level","internalName":"RED_GENERATION_BUFF","level":4,"cost":250},{"upgradeId":20,"maxLevel":5,"name":"Multi-Level","description":"Receive +5% more Red Ambrosia Bar Points per level","internalName":"RED_GENERATION_BUFF","level":5,"cost":300}],"playerUpgrades":[]}
        for (const u of upgrade.upgrades) {
          upgrade.playerUpgrades.push({level: u.maxLevel, upgradeId: u.upgradeId, internalName: u.internalName})
        }
        CartTab.#upgradesFetch?.resolve(<UpgradesResponse>upgrade)
        upgradeResponse = <UpgradesResponse>upgrade
      })
      .catch((err: Error) => CartTab.#upgradesFetch?.reject(err))

    return CartTab.#upgradesFetch.promise
  }

  static applySubtabListeners () {
    for (const [page, element] of yieldQuerySelectorAll('.subtabSwitcher button')) {
      element.addEventListener('click', changeSubTab.bind(null, Tabs.Purchase, { page }))
    }
  }

  #updateSubtabs () {
    for (const [index, element] of yieldQuerySelectorAll('.subtabSwitcher button')) {
      if (getActiveSubTab() === index) {
        element.classList.add('active-subtab')
      } else {
        element.classList.remove('active-subtab')
      }
    }

    clearProductPage()
    clearSubscriptionPage()
    clearUpgradeSubtab()
    clearCheckoutTab()
    clearMerchSubtab()
    clearConsumablesTab()

    switch (getActiveSubTab()) {
      case cartSubTabs.Coins:
        CartTab.fetchProducts().then(() => {
          if (getActiveSubTab() === cartSubTabs.Coins) {
            toggleProductPage()
          }
        })
        break
      case cartSubTabs.Subscriptions:
        CartTab.fetchProducts().then(() => {
          if (getActiveSubTab() === cartSubTabs.Subscriptions) {
            toggleSubscriptionPage()
          }
        })
        break
      case cartSubTabs.Upgrades:
        CartTab.fetchUpgrades().then(() => {
          if (getActiveSubTab() === cartSubTabs.Upgrades) {
            toggleUpgradeSubtab()
          }
        })
        break
      case cartSubTabs.Consumables:
        toggleConsumablesTab()
        break
      case cartSubTabs.Checkout:
        CartTab.fetchProducts().then(() => {
          if (getActiveSubTab() === cartSubTabs.Checkout) {
            toggleCheckoutTab()
          }
        })
        break
      case cartSubTabs.Merch:
        toggleMerchSubtab()
        break
    }
  }
}

const onInit = memoize(() => {
  CartTab.fetchProducts()
  CartTab.applySubtabListeners()

  changeSubTab(Tabs.Purchase, { page: 0 })
})

export const initializeCart = () => {
  onInit()

  new CartTab()
}
