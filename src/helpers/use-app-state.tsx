import React, {useContext, useEffect, useMemo, useState} from "react";
import {AppState} from "../AppState";

const AppStateContext = React.createContext<Record<string, AppState<any>>>({});

interface AppStateProviderProps {
	states: AppState<any>[],
	children: React.ReactNode
}

export const AppStateProvider = ({states, children}: AppStateProviderProps) => {
	const stateMap = useMemo(() => (states ?? []).reduce((acc, state) => ({...acc, [state.name]: state}), {}), [states]);
	
	return <AppStateContext.Provider value={stateMap}>
		{children}
	</AppStateContext.Provider>
}

export const useAppState = <T,>(appStateNameOrInstance: string | AppState<T>): {error: Error | null, state: T, setState: (data: Partial<T>) => Promise<T>} => {
	const appStates = useContext(AppStateContext);
	const appState = typeof appStateNameOrInstance === "string" ? appStates[appStateNameOrInstance] : appStateNameOrInstance;
	const [value, setValue] = useState<T>(appState.value);
	const [error, setError] = useState<Error | null>(null);
	
	useEffect(() => {
		return appState.subscribe((data, error) => {
			if (error) {
				setError(error)
			} else {
				setValue(data as T)
			}
		});
	}, []);
	
	return {
		state: value,
		error,
		setState: (...args) => appState.update(...args),
	};
}
