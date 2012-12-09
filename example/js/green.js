$(document).ready(function(){
	$('#headline').html("Page was first loaded with a GREEN Box!");
	$("#log p:nth-child(1)").after('<p class="green">js loaded @ green.js</p>');
});