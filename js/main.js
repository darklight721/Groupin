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
			index: 0,
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
			$(this.el).html(this.template({
				name: this.model.get('name'),
				star: this.model.get('starred') ? '' : '-empty'
			}));
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
	
	var AlterInputBtn = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.el_AlterInputView = $('#alter-input')[0];
			this.templateForBtn = _.template($('#tpl-alter-input-btn').html());
			
			this.alterInputShow = true;
			this.on("change:alterInputShow", this.render, this);
			
			// hide alter input view initially
			this.toggleAlterView();
		},
		
		render: function(eventName) {
			$(this.el).html(this.templateForBtn({"direction":this.alterInputShow?'left':'right'}));
			return this;
		},
		
		events: {
			"click #alterInputBtn": "toggleAlterView"
		},
		
		toggleAlterView: function() {
			$(this.el_AlterInputView).toggle();
			this.alterInputShow = !(this.alterInputShow);
			this.trigger("change:alterInputShow");
		},
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
			this.model.bind("add", this.render, this);
			this.model.bind("destroy", this.render, this);
			
			this.groupCount = 1;
			this.on("change:groupCount", this.render, this);
		},
		
		render: function(event) {
			this.validateGroupCount();
			var obj = {
				"groupCount" : this.groupCount,
				"plusDisabled" : this.groupCount < this.model.length ? '' : 'disabled',
				"minusDisabled": this.groupCount > 1 ? '' : 'disabled'
			};
			$(this.el).html(this.template(obj));
			return this;
		},
		
		validateGroupCount: function() {
			if (isNaN(this.groupCount))
				this.groupCount = 1;
			else if (this.groupCount < 1)
				this.groupCount = 1;
			else if (this.groupCount > this.model.length)
				this.groupCount = this.model.length;
		},
		
		events: {
			"change #groupCount": "change",
			"click .plus": "addOne",
			"click .minus": "minusOne",
			"click #groupin": "group"
		},
		
		change: function(event) {
			this.groupCount = parseInt(event.target.value);
			this.trigger("change:groupCount");
		},
		
		addOne: function() {
			this.groupCount++;
			this.trigger("change:groupCount");
		},
		
		minusOne: function() {
			this.groupCount--;
			this.trigger("change:groupCount");
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
				app.groupList.push({index: i, name: "Group "+(i+1)});
			}
			
			// Assign members to groups
			var randomList = _.shuffle(app.entityList.where({starred: false}));
			var randomStarredList = _.shuffle(app.entityList.where({starred: true}));

			var groupIndex = 0;
			_.each(randomList,function(entity){
				entity.set("group",groupIndex);
				groupIndex = (groupIndex+1) % groupCount;
			});
			_.each(randomStarredList,function(entity){
				entity.set("group",groupIndex);
				groupIndex = (groupIndex+1) % groupCount;
			});
			
			if (!app.groupListView)
				app.groupListView = new GroupListView({model: app.groupList});
			
			// hide alter input view 
			if (app.alterInputBtn.alterInputShow)
				app.alterInputBtn.toggleAlterView();
			
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
			this.templateForEntity = _.template($('#tpl-group-list-entity').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.template(this.model.toJSON()));
			_.each(app.entityList.where({group: this.model.get("index")}), function(entity){
				$(this.el).append(this.templateForEntity(entity.toJSON()));
			}, this);
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
			this.alterInputBtn = new AlterInputBtn();
			
			$('#entity-list').html(this.entityListView.render().el);
			$('#entity-add').html(new EntityAddView().render().el);
			$('#alter-input-toggler').html(this.alterInputBtn.render().el);
			$('#alter-input').html(new AlterInputView().render().el);
			$('#controls').html(new ControlView({model: this.entityList}).render().el);

			// add additional ui
			$('.star').tooltip({animation:true,title:'Starred names will be distributed fairly and equally among the groups.',delay:{show:800,hide:100}});
		}
	});
	
	var app;
	util.loadTemplates('template',function(){
		app = new AppRouter();
		Backbone.history.start();
	});
	
	
})(jQuery);