(function($){

	Backbone.View.prototype.close = function() {
		console.log('Closing View ' + this);
		if (this.beforeClose) 
		{
			this.beforeClose();
		}
		this.remove();
		this.unbind();
	}

	var Entity = Backbone.Model.extend({
		defaults: {
			starred: false,
			name: '',
			group: 0
		}
	});
	
	var EntityCollection = Backbone.Collection.extend({
		model: Entity
	});
	
	var Group = Backbone.Model.extend({
		defaults: {
			name: 'Group'
		}
	});
	
	var GroupCollection = Backbone.Collection.extend({
		model: Group
	});
	
	var EntityListView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.model.bind("reset", this.render, this);
			var self = this;
			this.model.bind("add", function(entity){
				$(self.el).append(new EntityListItemView({model:entity}).render().el);
			});
		},
		
		render: function(eventName) {
			$(this.el).html("");
			_.each(this.model.models, function(entity){
				$(this.el).append(new EntityListItemView({model:entity}).render().el);
			}, this);
			return this;
		},
	});
	
	var EntityAddView = Backbone.View.extend({
		initialize: function() {
			this.template = _.template($('#tpl-entity-add-item').html());
		},
		
		render: function(eventName) {
			$(this.el).html(this.template());
			return this;
		},
		
		events: {
			"click .add": "newEntity"
		},
		
		newEntity: function(event) {
			if (app.entityList)
			{
				app.entityList.push();
			}
			return false;
		}
	});
	
	var EntityListItemView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-entity-list-item').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		events: {
			"change .name": "changeEntity",
			"click .star": "starEntity",
			"click .delete": "deleteEntity"
		},
		
		changeEntity: function(event) {
			this.model.set({
				name: event.target.value
			});
		},
		
		starEntity: function() {
			var star = !(this.model.get('starred'));
			this.model.set({
				starred: star
			});
			return false;
		},
		
		deleteEntity: function() {
			this.model.destroy({
				success: function() {
					alert('Entity deleted successfully');
					window.history.back();
				}
			});
			return false;
		}
	});
	
	var AlterInputView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-alter-input-entity').html());
			this.delimiter = '\n';
		},
		
		render: function(eventName) {
			$(this.el).html(this.template());
			return this;
		},
		
		events: {
			"change #delimiter": "change",
			"change #otherDelimiter": "change",
			"click #import": "import",
			"change #fileInput": "readFile"
		},
		
		readFile: function(event) {
			var file = event.target.files ? event.target.files[0] : null;
			
			util.getDataFromFile(file, function(data){
				$('#text').val(data);
			});
		},
		
		change: function(event) {
			console.log(event.target.value);
			if (event.target.value)
			{
				if ($('#delimiter').val() === 'other')
				{
					$('#otherDelimiter').show();
				}
				else
				{
					switch(event.target.value)
					{
						case '\\n': 
							this.delimiter = '\n';
							break;
						case '\\t':
							this.delimiter = '\t';
							break;
						default:
							this.delimiter = event.target.value;
							break;
					}
					$('#otherDelimiter').hide();
				}
			}
		},
		
		import: function() {
			var text = $('#text').val();
			// reset model collection
			app.entityList.reset();
			_.each(text.split(this.delimiter), function(entity){
				entity = $.trim(entity);
				if (entity)
				{
					app.entityList.push({name:entity});
				}
			});
		}
	});
	
	var ControlView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-control').html());
			this.model.bind("add", this.setMaxGroupCount, this);
			this.model.bind("destroy", this.setMaxGroupCount, this);
		},
		
		render: function(event) {
			$(this.el).html(this.template({"max":this.model.length}));
			return this;
		},
		
		setMaxGroupCount: function() {
			$('#groupCount').attr("max",this.model.length);
			
			this.validateGroupCount();
		},
		
		validateGroupCount: function() {
			var value = parseInt($('#groupCount').val());
			if (value < 1 || value > this.model.length)
			{
				$('#groupCount').val("1");
			}
		},
		
		events: {
			"change #groupCount": "change",
			"click #groupin": "group"
		},
		
		change: function(event) {
			this.validateGroupCount();
		},
		
		group: function() {
			if (app.groupList)
				app.groupList.reset();
			else
				app.groupList = new GroupCollection();
				
			// Create groups
			var groupCount = parseInt($('#groupCount').val());
			for (var i = 0; i < groupCount; i++)
			{
				app.groupList.push({name: "Group "+(i+1)});
			}
			
			/*
			
			// Assign groups to members
			var entities = app.entityList.models;
			var starredEntities = [];
			var j = 0;
			while (entities.length)
			{
				for (j = 0; j < groupCount && entities.length; j++)
				{
					var index = Math.floor(Math.random() * entities.length);
					entities.splice(index,1);
					var entity = app.entityList.at(index);
					if (entity.get('starred'))
					{
						starredEntities.push(entity);
					}
					else
					{
						app.entityList.getByCid(entity.cid).set({group: j});
					}
				}
			}
			
			while(starredEntities.length)
			{
				for (; j < groupCount && starredEntities.length; j++)
				{
					var index = Math.floor(Math.random() * starredEntities.length);
					entities.splice(index,1);
					var entity = app.entityList.at(index);
					app.entityList.getByCid(entity.cid).set({group: j});
				}
			}
			
			*/
			
			if (!app.groupListView)
				app.groupListView = new GroupListView({model: app.groupList});
			
			$('#group-list').html(app.groupListView.render().el);
		}
		
	});
	
	var GroupListView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.model.bind("reset", this.render, this);
			var self = this;
			this.model.bind("add", function(group){
				$(self.el).append(new GroupListItemView({model:group}).render().el);
			});
		},
		
		render: function(eventName) {
			$(this.el).html("");
			_.each(this.model.models, function(group){
				$(this.el).append(new GroupListItemView({model:group}).render().el);
			}, this);
			return this;
		}
	});
	
	var GroupListItemView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-group-list-item').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		events: {
			"change .name": "changeGroup"
		},
		
		changeGroup: function(event) {
			this.model.set({
				name: event.target.value
			});
		}
	});
	
	var AppRouter = Backbone.Router.extend({
		
		routes: {
			"": "home"
		},
		
		home: function() {
			this.entityList = new EntityCollection();
			
			this.entityList.push();
			this.entityList.push();
			
			this.entityListView = new EntityListView({model: this.entityList});
			
			$('#entity-list').html(this.entityListView.render().el);
			$('#entity-add').html(new EntityAddView().render().el);
			$('#alter-input').html(new AlterInputView().render().el);
			$('#controls').html(new ControlView({model: this.entityList}).render().el);
		}
	});
	
	var app;
	util.loadTemplates('template',function(){
		app = new AppRouter();
		Backbone.history.start();
	});
	
	
})(jQuery);