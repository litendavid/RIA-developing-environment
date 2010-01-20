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

