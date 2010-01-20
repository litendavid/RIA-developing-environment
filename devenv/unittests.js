// JSpec 
/*

JSpec.describe("My application",function(){
	before_each(function(){
		app = Application; // path to singleton here
	});
	describe("when starting up",function(){
		it("should have an init function",function(){
			expect(typeof app.init).to(be,"function");
		});
	});
});

*/
// QUnit

QUnit.test("My application when starting up", function(){
	equals(typeof app.init,"function","should have an init function");
	ok(true,"vafan?!");
});
