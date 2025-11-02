cat > jest.config.js << 'EOF'
export const moduleFileExtensions = ['js', 'json', 'ts'];
export const rootDir = 'src';
export const testRegex = '.*\\.spec\\.ts$';
export const transform = {
    '^.+\\.(t|j)s$': 'ts-jest',
};
export const collectCoverageFrom = [
    '**/*.(t|j)s',
];
export const coverageDirectory = '../coverage';
export const testEnvironment = 'node';
export const moduleNameMapper = {
    '^src/(.*)$': '<rootDir>/$1',
};
EOF