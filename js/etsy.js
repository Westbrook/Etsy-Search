window.app = {
	collection: {},
	model: {},
	view: {}
};
app.model.Listing = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this);
	},
	url: function() {
		return 	'http://openapi.etsy.com/v2/listings/'+this.id+'.js?api_key=CMCCX1OZDKGQ4M1LA2GLLSJL';	
	},
	scope: function() {
		var newAttrs = this.get('results')[0];
		this.clear();
		this.set(newAttrs);
		this.trigger('scoped');
	}
});
app.collection.EtsySearch = Backbone.Collection.extend({
	initialize: function() {
		_.bindAll(this);
	},
	scope: function() {
		this.reset(this.at(0).get('results'));
		this.trigger('scoped');
	}
});
app.collection.Listings = app.collection.EtsySearch.extend({
	model: app.model.Listing,
	url: function() {
		return 'http://openapi.etsy.com/v2/listings/active.js?api_key=CMCCX1OZDKGQ4M1LA2GLLSJL&limit='+this.limit+'&keywords='+this.searchTerm;	
	},
	limit: 10
});
app.collection.ProductImages = app.collection.EtsySearch.extend({
	url: function() {
		return 'http://openapi.etsy.com/v2/listings/'+this.id+'/images.js?api_key=CMCCX1OZDKGQ4M1LA2GLLSJL';	
	}
});
app.view.ProductImages = Backbone.View.extend({
	initialize: function() {
		_.bindAll(this);
		this.collection = new app.collection.ProductImages();
		this.collection.id = this.id;
		this.collection.on('scoped',this.render);
	},
	currentImage: 0,
	setTemplate: function(templateEl) {
		this.template = Handlebars.compile($(templateEl).html());
	},
	render: function() {
		if(this.collection.at(this.currentImage)){
			this.$el.html(this.template(this.collection.at(this.currentImage).attributes));
		}
	}
});
app.view.Product = Backbone.View.extend({
	el: '#product',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#product-template').html());
		this.model.on('scoped', this.render);
		this.render();
		this.images = new app.view.ProductImages({id: this.model.get('listing_id')});
		this.images.$el = this.$el.find('.image');
		this.images.setTemplate('#product-image-template');
		this.images.collection.fetch({dataType: "jsonp", success: this.images.collection.scope});
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
	}
});
app.view.Result = Backbone.View.extend({
	className: 'result',
	events: {
		'click .more': 'viewMore'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#result-template').html());
	},
	setImages: function() {
		this.images = new app.view.ProductImages({id: this.model.get('listing_id')});
		this.images.$el = this.$el.find('.image');
		this.images.setTemplate('#result-image-template');
		this.images.collection.fetch({dataType: "jsonp", success: this.images.collection.scope});
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;	
	},
	viewMore: function() {
		this.model.trigger('viewProduct', this.model);
	}
});
app.view.Results = Backbone.View.extend({
	el: '#results',
	initialize: function() {
		_.bindAll(this);
		this.collection.on('scoped', this.render);	
		this.results = {};
	},
	render: function() {
		this.$el.empty();
    	this.collection.each(this.addResult);
	},
	addResult: function(result) {
		result.on('viewProduct', this.viewProduct);
		this.results[result.get('listing_id')] = new app.view.Result({model: result});
    	this.$el.append(this.results[result.get('listing_id')].render().el);
		//this.results[result.get('listing_id')].setImages();			//Public requests are capped at 10r/s, making this untenable.  But, it would be much cooler.
	},
	viewProduct: function(model) {
		this.trigger('viewProduct', model);
	}
});
app.view.EtsySearch = Backbone.View.extend({
	el: '#app',
	events: {
		'click .search': 'searchListings',
		'submit form': 'searchListings'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#app-template').html());
		this.render();
		this.listings = new app.collection.Listings();
		this.results = new app.view.Results({
			collection: this.listings
		});
		this.results.on('viewProduct', this.viewProduct);
	},
	render: function() {
		this.$el.html(this.template());
	},
	searchListings: function(e) {
		e.preventDefault();
		this.listings.searchTerm = this.$el.find('.search-term').val();
		this.listings.fetch({dataType: "jsonp", success: this.listings.scope});
	},
	viewProduct: function(model) {
		this.product = new app.view.Product({model: model});
	}
});