import {useEffect, useState} from "react";
import {AppState} from "../AppState";

export const useAppState = <T,>(appState: AppState<T>): {error: Error | null, state: T} => {
	const [state, setState] = useState<T>(appState.value);
	const [error, setError] = useState<Error | null>(null);
	
	useEffect(() => {
		return appState.subscribe((data, error) => {
			if (error) {
				setError(error)
			} else {
				setState(data as T)
			}
		});
	}, []);
	
	return {
		state,
		error
	};
}
