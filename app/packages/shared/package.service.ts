import { Injectable, NgZone } from "@angular/core";
import { Http } from "@angular/http";
import firebase = require("nativescript-plugin-firebase");
import { Observable } from "rxjs/Observable";

import { Config } from "../../shared/config";
import { Package } from "./package.model";

import _ = require('lodash');

const editableProperties = [
    "Id",
    "Label",
    "Quantity",
    "PackageType",
];

/* ***********************************************************
* This is the master detail data service. It handles all the data operations
* of retrieving and updating the data. In this case, it is connected to Firebase and
* is using the {N} Firebase plugin. Learn more about it here:
* https://github.com/EddyVerbruggen/nativescript-plugin-firebase
* The {N} Firebase plugin needs some initialization steps before the app starts.
* Check out how it is imported in the main.ts file and the actual script in /shared/firebase.common.ts file.
*************************************************************/
@Injectable()
export class PackageService {
    private static cloneUpdateModel(paccage: Package): object {
        return editableProperties.reduce((a, e) => (a[e] = paccage[e], a), {}); // tslint:disable-line:ban-comma-operator
    }

    private _packages: Array<Package> = [];

    constructor(private _ngZone: NgZone) { }

    getPackageById(id: number): Package {
        if (!id) {
            return;
        }

        return this._packages.filter((paccage) => {
            return paccage.Id == id;
        })[0];
    }

    load(): Observable<any> {
        return new Observable((observer: any) => {
            const path = "packages";

            const onValueEvent = (snapshot: any) => {
                this._ngZone.run(() => {
                    //snapshot.value = _.filter(snapshot.value, {owner: 'rragsda'})
                    const results = this.handleSnapshot(snapshot.value);
                    observer.next(results);
                });
            };
            firebase.addValueEventListener(onValueEvent, `/${path}`);
        }).catch(this.handleErrors);
    }

    update(packageModel: Package): Promise<any> {
        const updateModel = PackageService.cloneUpdateModel(packageModel);

        return firebase.update("/packages/" + packageModel.Id, updateModel);
    }

    uploadImage(remoteFullPath: string, localFullPath: string): Promise<any> {
        return firebase.uploadFile({
            localFullPath,
            remoteFullPath,
            onProgress: null
        });
    }

    private handleSnapshot(data: any): Array<Package> {
        this._packages = [];

        if (data) {
            for (const id in data) {
                if (data.hasOwnProperty(id)) {
                    this._packages.push(new Package(data[id]));
                }
            }
        }

        return this._packages;
    }

    private handleErrors(error: Response): Observable<any> {
        return Observable.throw(error);
    }
}
