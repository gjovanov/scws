const defaultName = 'This field'
const requiredFiledRule = (name = defaultName) => {
  return (v) => !!v || `${name} is required`
}
const minCharsRule = (name = defaultName, min = 4) => {
  return (v) =>
    (v && v.length >= 4) ||
    `${name} must be greater than or equal to ${min} characters`
}
const maxCharsRule = (name = defaultName, max = 20) => {
  return (v) =>
    (v && v.length <= 20) || `${name} must be less than ${max} characters`
}
const allowedCharsRule = () => {
  return (v) =>
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ||
    'Unallowed characters, use lowercase alphanumeric characters only'
}

export const rules = {
  required: (name) => [requiredFiledRule(name)],
  name: (name) => [
    requiredFiledRule(name),
    minCharsRule(name),
    maxCharsRule(name),
    allowedCharsRule(name),
  ],
  email: [
    requiredFiledRule('Email'),
    (v) => /\S+@\S+\.\S+/.test(v) || 'Invalid email address',
  ],
  password: [requiredFiledRule('Password'), minCharsRule('Password', 8)],
  nekoPassword: [requiredFiledRule('Password'), minCharsRule('Password', 4)],
}
