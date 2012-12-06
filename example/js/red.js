$(document).ready(function(){
	$('#headline').html("Page was first loaded with a RED Box!");
	$("#log p:nth-child(1)").after("<p>js loaded @ headline_blue.js</p>");
});