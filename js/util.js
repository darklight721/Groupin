var util = {
	loadTemplates: function(name, callback) {
		$.get('tpl/' + name + '.html', function(data){
			$('#templates').html(data);
			if (callback)
			{
				callback();
			}
		});
	}
};