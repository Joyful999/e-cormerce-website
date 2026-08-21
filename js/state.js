/* LUXORA — state.js
   Single source of truth for client-side state, persisted to localStorage.
   No page duplicates this state — every page reads/writes through this module. */

const State = (() => {

  const KEYS = {
    cart: 'luxora_cart',
    wishlist: 'luxora_wishlist',
    orders: 'luxora_orders',
    user: 'luxora_user',
    theme: 'luxora_theme',
    recentlyViewed: 'luxora_recent',
    compare: 'luxora_compare',
    recentSearches: 'luxora_recent_searches'
  };

  function read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function write(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* storage unavailable */ }
  }

  // ---------- Cart ----------
  function getCart(){ return read(KEYS.cart, []); }
  function saveCart(cart){ write(KEYS.cart, cart); document.dispatchEvent(new CustomEvent('cart:change')); }
  function addToCart(product, qty = 1, color = null){
    const cart = getCart();
    const key = product.id + '_' + (color || 'default');
    const existing = cart.find(i => i.key === key);
    if (existing){ existing.qty += qty; }
    else{
      cart.push({
        key, id: product.id, title: product.title, price: product.price,
        image: product.thumbnail || (product.images && product.images[0]), qty, color, savedForLater:false
      });
    }
    saveCart(cart);
  }
  function updateQty(key, qty){
    const cart = getCart();
    const item = cart.find(i => i.key === key);
    if (item){ item.qty = Math.max(1, qty); saveCart(cart); }
  }
  function removeFromCart(key){ saveCart(getCart().filter(i => i.key !== key)); }
  function toggleSaveForLater(key){
    const cart = getCart();
    const item = cart.find(i => i.key === key);
    if (item){ item.savedForLater = !item.savedForLater; saveCart(cart); }
  }
  function clearCart(){ saveCart([]); }
  function cartCount(){ return getCart().filter(i=>!i.savedForLater).reduce((s,i) => s + i.qty, 0); }
  function cartSubtotal(){ return getCart().filter(i=>!i.savedForLater).reduce((s,i) => s + i.qty * i.price, 0); }

  // ---------- Wishlist ----------
  function getWishlist(){ return read(KEYS.wishlist, []); }
  function saveWishlist(w){ write(KEYS.wishlist, w); document.dispatchEvent(new CustomEvent('wishlist:change')); }
  function isWishlisted(id){ return getWishlist().some(p => p.id === id); }
  function toggleWishlist(product){
    let w = getWishlist();
    if (isWishlisted(product.id)){ w = w.filter(p => p.id !== product.id); }
    else{ w.push({ id: product.id, title: product.title, price: product.price, image: product.thumbnail || (product.images && product.images[0]), rating: product.rating }); }
    saveWishlist(w);
    return isWishlisted(product.id);
  }
  function removeFromWishlist(id){ saveWishlist(getWishlist().filter(p => p.id !== id)); }

  // ---------- Orders ----------
  function getOrders(){ return read(KEYS.orders, []); }
  function saveOrder(order){
    const orders = getOrders();
    orders.unshift(order);
    write(KEYS.orders, orders);
    return order;
  }

  // ---------- Demo user / auth ----------
  function getUser(){ return read(KEYS.user, null); }
  function saveUser(user){ write(KEYS.user, user); }
  function logout(){ localStorage.removeItem(KEYS.user); }

  // ---------- Theme ----------
  function getTheme(){ return read(KEYS.theme, 'light'); }
  function setTheme(t){ write(KEYS.theme, t); }

  // ---------- Recently viewed ----------
  function getRecentlyViewed(){ return read(KEYS.recentlyViewed, []); }
  function pushRecentlyViewed(product){
    let list = getRecentlyViewed().filter(p => p.id !== product.id);
    list.unshift({ id: product.id, title: product.title, price: product.price, image: product.thumbnail || (product.images && product.images[0]), rating: product.rating });
    list = list.slice(0, 6);
    write(KEYS.recentlyViewed, list);
  }

  // ---------- Compare ----------
  function getCompare(){ return read(KEYS.compare, []); }
  function toggleCompare(product){
    let list = getCompare();
    const exists = list.some(p => p.id === product.id);
    if (exists){ list = list.filter(p => p.id !== product.id); }
    else{
      if (list.length >= 3) return { ok:false, list };
      list.push(product);
    }
    write(KEYS.compare, list);
    document.dispatchEvent(new CustomEvent('compare:change'));
    return { ok:true, list };
  }
  function clearCompare(){ write(KEYS.compare, []); document.dispatchEvent(new CustomEvent('compare:change')); }

  // ---------- Recent searches ----------
  function getRecentSearches(){ return read(KEYS.recentSearches, []); }
  function pushRecentSearch(q){
    if (!q || !q.trim()) return;
    let list = getRecentSearches().filter(s => s.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    list = list.slice(0, 6);
    write(KEYS.recentSearches, list);
  }
  function clearRecentSearches(){ write(KEYS.recentSearches, []); }

  return {
    getCart, saveCart, addToCart, updateQty, removeFromCart, toggleSaveForLater, clearCart, cartCount, cartSubtotal,
    getWishlist, isWishlisted, toggleWishlist, removeFromWishlist,
    getOrders, saveOrder,
    getUser, saveUser, logout,
    getTheme, setTheme,
    getRecentlyViewed, pushRecentlyViewed,
    getCompare, toggleCompare, clearCompare,
    getRecentSearches, pushRecentSearch, clearRecentSearches
  };
})();
