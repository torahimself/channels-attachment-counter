class CategoryScanner {
  constructor(client) {
    this.client = client;
  }

  // Get all channels from specified categories
  getChannelsFromCategories(categoryIds) {
    const channels = [];
    
    for (const categoryId of categoryIds) {
      const category = this.client.channels.cache.get(categoryId);
      if (category && category.type === 4) { // 4 = GUILD_CATEGORY
        const categoryChannels = category.children.cache.filter(ch => 
          ch.isTextBased() && !ch.isThread()
        );
        channels.push(...categoryChannels.values());
      }
    }
    
    return channels;
  }

  // Get category name by ID
  getCategoryName(categoryId) {
    const category = this.client.channels.cache.get(categoryId);
    return category ? category.name : `Unknown Category (${categoryId})`;
  }

  // Get all categories data
  getCategoriesData(categoryIds) {
    return categoryIds.map(id => ({
      id: id,
      name: this.getCategoryName(id),
      channels: this.getChannelsFromCategories([id])
    }));
  }
}

module.exports = CategoryScanner;
