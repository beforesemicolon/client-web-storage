import {useEffect, useState} from "react";
import {ClientStore} from "../ClientStore";
import {StoreState} from "../types";
import {DefaultStoreState, withClientStore} from "./with-client-store";

export const useClientStore = <T,>(store: ClientStore<T>): StoreState<T> => {
	const [data, updateData] = useState<StoreState<T>>(DefaultStoreState);
	
	useEffect(() => {
		return withClientStore(store, updateData);
	}, []);
	
	return data;
}
