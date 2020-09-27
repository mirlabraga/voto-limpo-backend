import { people_v1, google } from "googleapis";
import { Supporter } from "../datasources/supporter";
import { getAuth } from "./auth";

export const getAllContacts = async (supporter: Supporter): Promise<people_v1.Schema$Person[]> => {

    const auth = getAuth(supporter)
    const peopleApi =  google.people({ version: 'v1', auth });

    let people: people_v1.Schema$Person[] = []
    const commomOptions: people_v1.Params$Resource$People$Connections$List = {
        personFields: 'names,emailAddresses,phoneNumbers',
        pageSize: 1000,
        resourceName: 'people/me'
    }
    let result = await peopleApi.people.connections.list(commomOptions);
    while(result.data?.nextPageToken) {
        people.push(...result.data?.connections);
        result = await peopleApi.people.connections.list({
            ...commomOptions,
            pageToken: result.data?.nextPageToken
        });
    }
    people.push(...result.data?.connections);
    return people;
}