export interface MessageDialogData {
    title: string
    titleBold?: string | null
    message: string
    okButtonText: string
    okButtonColor: 'primary' | 'accent' | 'warn'
    list?: string[]
    secondMessage?: string
    finalMessage?: string
}