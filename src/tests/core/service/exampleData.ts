export const t1 = `Through the Looking-Glass, and What Alice Found There is a novel published in December 1871 by Lewis Carroll, the pen name of Charles Lutwidge Dodgson, a mathematics lecturer at Christ Church, Oxford. It is the sequel to his Alice's Adventures in Wonderland (1865), in which many of the characters were anthropomorphic playing cards. In this second novel, the theme is chess. As in the earlier book, the central figure, Alice, enters a fantastical world, this time by climbing through a large looking-glass (a mirror)[n 1] into a world that she can see beyond. There she finds that, just as in a reflection, things are reversed, including logic (for example, running helps one remain stationary, walking away from something brings one towards it, chessmen are alive and nursery-rhyme characters are real).

Among the characters Alice meets are the severe Red Queen,[n 2] the gentle and flustered White Queen, the quarrelsome twins Tweedledum and Tweedledee, the rude and opinionated Humpty Dumpty, and the kindly but impractical White Knight. Eventually, as in the earlier book, after a succession of strange adventures, Alice wakes and realises she has been dreaming. As in Alice's Adventures in Wonderland, the original illustrations are by John Tenniel.

The book contains several verse passages, including "Jabberwocky", "The Walrus and the Carpenter" and the White Knight's ballad, "A-sitting On a Gate". Like Alice's Adventures in Wonderland, the book introduces phrases that have become common currency, including "jam to-morrow and jam yesterday – but never jam to-day", "sometimes I've believed as many as six impossible things before breakfast", "un-birthday presents", "portmanteau words" and "as large as life and twice as natural".

Through the Looking Glass has been adapted for the stage and the screen and translated into many languages. Critical opinion of the book has generally been favourable and either ranked it on a par with its predecessor or else only just short of it.

`;

const allExampleText = [t1];

export const exampleText = (version: number): string =>
    allExampleText[version - 1];
