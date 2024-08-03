declare namespace jest {
    interface Expect {
        toBeTypeOrNull(classTypeOrNull : any) : CustomMatcherResult;
    }
}