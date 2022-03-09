function Validator(formSelector) {
    const _this = this
    const formRules = {}

    const getParent = function (element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    const validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        isEmail: function (value) {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Trường này phải là Email'
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`
            }
        }
    }

    const formElement = document.querySelector(formSelector)

    if (formElement) {
        const inputs = formElement.querySelectorAll('input[name][rules]')

        inputs.forEach((input) => {
            const rules = input.getAttribute('rules').split('|')
            rules.forEach((rule) => {
                let ruleInfo
                const isRuleHasValue = rule.includes(':')

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                let ruleFunc = validatorRules[rule]

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {
                    formRules[input.name] = [ruleFunc]
                }
            })

            input.onblur = handleValidate
            input.oninput = handleClearError
        })

        function handleValidate(e) {
            const rules = formRules[e.target.name]
            let errorMessage
            for (const rule of rules) {
                errorMessage = rule(e.target.value)
                if (errorMessage) break
            }

            if (errorMessage) {
                const formGroup = getParent(e.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')
                    const formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {

                        formMessage.innerText = errorMessage
                    }
                }
            }

            return !errorMessage
        }

        function handleClearError(e) {
            const formGroup = getParent(e.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')
                const formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {

                    formMessage.innerText = ''
                }
            }
        }
    }

    formElement.onsubmit = (e) => {
        e.preventDefault()

        const inputs = formElement.querySelectorAll('input[name][rules]')
        let isValid = true
        inputs.forEach((input) => {
            if (!handleValidate({ target: input })) {
                isValid = false
            }
        })

        if (isValid) {
            if (typeof _this.onSubmit === 'function') {
                let enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                const formValues = Array.from(enableInputs).reduce((values, input) => {

                    switch (input.type) {
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = ''
                                return values
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = []
                            }
                            values[input.name].push(input.value)
                            break
                        case 'radio':
                            values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`)?.value || ''
                            break
                        case 'file':
                            values[input.name] = input.files
                            break
                        default:
                            values[input.name] = input.value
                    }

                    return values
                }, {})

                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}