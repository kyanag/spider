export function get_class(obj: any){
    if(typeof(obj) == "object"){
        return arguments.constructor;
    }
    return typeof(obj);
}