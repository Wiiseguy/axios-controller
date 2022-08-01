declare interface AxiosControllerHttp {
    get: (...args: any[]) => Promise<any>;
    head: (...args: any[]) => Promise<any>;
    post: (...args: any[]) => Promise<any>;
    put: (...args: any[]) => Promise<any>;    
    patch: (...args: any[]) => Promise<any>;
    delete: (...args: any[]) => Promise<any>;    
}

declare interface AxiosControllerInstance {
    getUri: (...urlParts: string[]) => string;
}

declare type AxiosControllerConstructor = (<T>(controller: string, fn?: (http: AxiosControllerHttp) => T) => T & AxiosControllerInstance)
