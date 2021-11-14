import React from "react";

export * from './MaterialIcons'
export * from './jcss'

export const SayHello = ({ name }: { name: string }): JSX.Element => {
    return (<div>Hey {name}, say hello to TypeScript.</div>)
}
