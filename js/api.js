/* LUXORA — api.js
   Centralized data layer. Talks to the DummyJSON public e-commerce API
   (https://dummyjson.com) for real product data: names, images, prices,
   categories, ratings and reviews. No private keys are used — this is a
   fully public, keyless REST API. */

const API = (() => {

  const BASE = 'https://dummyjson.com';
  const cache = new Map(); // simple in-memory GET cache to avoid refetching identical data

  async function request(path){
    if (cache.has(path)) return cache.get(path);
    let res;
    try{
      res = await fetch(BASE + path);
    }catch(err){
      throw new Error('NETWORK_ERROR');
    }
    if (!res.ok) throw new Error('API_ERROR_' + res.status);
    const data = await res.json();
    cache.set(path, data);
    return data;
  }

  function normalize(p){
    if (!p) return null;
    const discount = p.discountPercentage ? Math.round(p.discountPercentage) : 0;
    const original = discount ? +(p.price / (1 - discount/100)).toFixed(2) : null;
    return {
      id: p.id,
      title: p.title,
      brand: p.brand || p.category,
      category: p.category,
      description: p.description,
      price: p.price,
      originalPrice: original,
      discount: discount,
      rating: p.rating || 0,
      stock: p.stock,
      thumbnail: p.thumbnail,
      images: (p.images && p.images.length) ? p.images : [p.thumbnail],
      tags: p.tags || [],
      reviews: p.reviews || [],
      isNew: (p.id % 5 === 0), // deterministic demo "new" flag since API has no launch date
      colors: deriveColors(p.id)
    };
  }

  function deriveColors(id){
    const palette = ['#17181A','#A9722F','#45573E','#A23B3B','#E7E3DA','#3A3F58'];
    const start = id % palette.length;
    return [palette[start], palette[(start+2)%palette.length], palette[(start+4)%palette.length]];
  }

  async function getProducts({ limit = 100, skip = 0 } = {}){
    const data = await request(`/products?limit=${limit}&skip=${skip}`);
    return { products: (data.products||[]).map(normalize), total: data.total };
  }

  async function getProductById(id){
    try{
      const p = await request(`/products/${id}`);
      if (p && p.message) return null;
      return normalize(p);
    }catch(err){
      return null;
    }
  }

  async function getCategories(){
    const data = await request('/products/categories');
    // DummyJSON returns array of {slug,name,url}
    return (data||[]).map(c => (typeof c === 'string') ? { slug:c, name:c } : { slug:c.slug, name:c.name });
  }

  async function getProductsByCategory(slug, { limit = 100 } = {}){
    const data = await request(`/products/category/${encodeURIComponent(slug)}?limit=${limit}`);
    return { products: (data.products||[]).map(normalize), total: data.total };
  }

  async function searchProducts(q, { limit = 24 } = {}){
    if (!q || !q.trim()) return { products: [], total: 0 };
    const data = await request(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    return { products: (data.products||[]).map(normalize), total: data.total };
  }

  return { getProducts, getProductById, getCategories, getProductsByCategory, searchProducts };
})();
