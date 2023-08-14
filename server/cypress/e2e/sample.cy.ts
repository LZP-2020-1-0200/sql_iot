describe('Sample tests', () => {
    it('can add a new sample', () => {
        cy.visit('http://localhost');
        cy.get('[href="/samples/add"').click();
        cy.get('[name="name"]').type('test sample');
        cy.get('[name="description"]').type('test description');
        cy.get('[type="submit"]').click();
    });
});