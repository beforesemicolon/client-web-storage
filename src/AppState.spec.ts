import {AppState} from "./AppState";

interface State {
	foo: number;
	boo: string;
}

describe("AppState", () => {
	it('should create an app state', async () => {
		const appState = new AppState<State>('app', {
			foo: 12,
			boo: String
		});
		
		expect(appState.value.foo).toEqual(12);
		expect(appState.value.boo).toEqual("");
		
		const subscriber = jest.fn();
		
		const unsubscribe = appState.subscribe(subscriber);
		const stopIntercept = appState.intercept((data) => {
			if (data.foo && data.foo < 0) {
			    data.foo = 0;
			}
			
			if (data.boo === "-") {
				throw new Error("Invalid")
			}
		});
		
		let res = await appState.update({
			foo: -8,
			boo: "sample"
		})
		
		expect(res).toEqual({boo: "sample", foo: 0});
		expect(subscriber).toHaveBeenCalledWith(res, null);
		subscriber.mockClear();
		
		try {
			res = await appState.update({
				foo: 100,
				boo: "-"
			})
		} catch(e) {
	    expect(e).toEqual(new Error("Invalid"))
		}
		
		expect(res).toEqual({boo: "sample", foo: 0});
		expect(subscriber).toHaveBeenCalledWith(null, new Error("Invalid"));
		subscriber.mockClear();
		
		unsubscribe();
		stopIntercept();
		
		res = await appState.update({
			foo: -10,
			boo: "-",
		});
		
		expect(subscriber).not.toHaveBeenCalled();
		expect(subscriber).not.toHaveBeenCalled();
		expect(res).toEqual({boo: "-", foo: -10});
	});
})
