import React, {useContext, useEffect, useMemo, useState} from "react";
import {ClientStore} from "../ClientStore";
import {StoreState} from "../types";
import {DefaultStoreState, withClientStore} from "./with-client-store";

const ClientStoreContext = React.createContext<Record<string, ClientStore<any>>>({});

interface ClientStoreProviderProps {
	stores: ClientStore<any>[],
	children: React.ReactNode
}

export const ClientStoreProvider = ({stores, children}: ClientStoreProviderProps) => {
	const storeMap = useMemo(() => stores.reduce((acc, store) => ({...acc, [store.name]: store}), {}), [stores]);
	
	return <ClientStoreContext.Provider value={storeMap}>
		{children}
	</ClientStoreContext.Provider>
}

export const useClientStore = <T,>(storeNameOrInstance: string | ClientStore<T>): StoreState<T> => {
	const stores = useContext(ClientStoreContext);
	const clientStore: ClientStore<T> = typeof storeNameOrInstance === "string" ? stores[storeNameOrInstance] : storeNameOrInstance;
	const [data, updateData] = useState<StoreState<T>>(DefaultStoreState<T>(clientStore));
	
	useEffect(() => {
		if (!(clientStore instanceof ClientStore)) {
			throw new Error(`Could Not Find Client Store "${clientStore}"`);
		}
		
		return withClientStore(clientStore, updateData);
	}, []);
	
	return data;
}



