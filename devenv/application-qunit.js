QUnit.start();
test("My application when starting up", function(){
	equals(typeof Application.init,"function","should have an init function");
	ok(true,"true should definitely be trueish");
});
